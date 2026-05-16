import { useState, useRef, useCallback, useEffect } from 'react';

interface ImageCropModalProps {
  imageFile: File;
  onConfirm: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropModal({ imageFile, onConfirm, onCancel }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const CANVAS_SIZE = 280;
  const CIRCLE_RADIUS = CANVAS_SIZE / 2 - 10;

  // Load image from file
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setImageSrc(src);
      const image = new Image();
      image.onload = () => {
        setImg(image);
        // Calculate initial zoom so image fills the circle
        const minDim = Math.min(image.width, image.height);
        const initialZoom = (CIRCLE_RADIUS * 2) / minDim;
        setZoom(Math.max(initialZoom, 0.1));
        setOffset({ x: 0, y: 0 });
      };
      image.src = src;
    };
    reader.readAsDataURL(imageFile);
  }, [imageFile]);

  // Draw preview
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d')!;
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw image centered with zoom and offset
    const drawW = img.width * zoom;
    const drawH = img.height * zoom;
    const drawX = centerX - drawW / 2 + offset.x;
    const drawY = centerY - drawH / 2 + offset.y;

    ctx.save();
    // Clip to circle for preview
    ctx.beginPath();
    ctx.arc(centerX, centerY, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Dark overlay outside circle
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(centerX, centerY, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Circle border
    ctx.beginPath();
    ctx.arc(centerX, centerY, CIRCLE_RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [img, zoom, offset]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Mouse/touch drag
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = () => {
    setDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.05, Math.min(5, z + delta)));
  };

  // Crop and export
  const handleConfirm = async () => {
    if (!img) return;
    setProcessing(true);

    const outputSize = 400;
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = outputSize;
    outputCanvas.height = outputSize;
    const ctx = outputCanvas.getContext('2d')!;

    // Calculate source coordinates
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const drawW = img.width * zoom;
    const drawH = img.height * zoom;
    const drawX = centerX - drawW / 2 + offset.x;
    const drawY = centerY - drawH / 2 + offset.y;

    // Map circle bounds to image coordinates
    const circleLeft = centerX - CIRCLE_RADIUS;
    const circleTop = centerY - CIRCLE_RADIUS;
    const circleDiameter = CIRCLE_RADIUS * 2;

    // Scale factor from canvas to output
    const scale = outputSize / circleDiameter;

    // Draw circular clip on output canvas
    ctx.beginPath();
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw the image positioned correctly
    const outDrawX = (drawX - circleLeft) * scale;
    const outDrawY = (drawY - circleTop) * scale;
    const outDrawW = drawW * scale;
    const outDrawH = drawH * scale;
    ctx.drawImage(img, outDrawX, outDrawY, outDrawW, outDrawH);

    outputCanvas.toBlob(
      (blob) => {
        if (blob) onConfirm(blob);
        setProcessing(false);
      },
      'image/webp',
      0.85
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative glass-card p-6 rounded-2xl border border-white/10 max-w-sm w-full animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-heading font-bold text-text-main mb-4 text-center">
          Sesuaikan Foto
        </h3>

        {/* Canvas */}
        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="rounded-xl cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 mb-4 px-2">
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
          </svg>
          <input
            type="range"
            min="0.05"
            max="5"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-primary bg-white/10 rounded-lg appearance-none cursor-pointer"
          />
          <svg className="w-4 h-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
        </div>

        <p className="text-xs text-text-muted text-center mb-4">
          Geser foto untuk mengatur posisi • Scroll/slider untuk zoom
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-text-muted hover:bg-white/5 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={processing || !img}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-bg-dark font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {processing ? '⏳ Memproses...' : '✅ Gunakan'}
          </button>
        </div>
      </div>
    </div>
  );
}
