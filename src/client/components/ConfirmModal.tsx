import { useState, useEffect } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  requireType?: string; // User harus ketik teks ini untuk konfirmasi
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  danger = true,
  requireType,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const [typed, setTyped] = useState('');

  useEffect(() => {
    if (!isOpen) setTyped('');
  }, [isOpen]);

  // Tutup modal dengan Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const canConfirm = requireType ? typed === requireType : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_150ms_ease-out]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative glass-card border border-white/15 p-6 max-w-md w-full animate-[scaleIn_200ms_ease-out] shadow-2xl">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl ${
          danger ? 'bg-danger/15 border border-danger/30' : 'bg-primary/15 border border-primary/30'
        }`}>
          {danger ? '⚠️' : 'ℹ️'}
        </div>

        {/* Content */}
        <h3 className="font-heading font-bold text-xl text-center mb-2">{title}</h3>
        <p className="text-text-muted text-sm text-center mb-5 leading-relaxed">{message}</p>

        {/* Type to confirm */}
        {requireType && (
          <div className="mb-5">
            <p className="text-xs text-text-muted mb-2 text-center">
              Ketik <span className="font-mono font-bold text-danger">"{requireType}"</span> untuk konfirmasi:
            </p>
            <input
              className="input-field text-center text-sm font-mono"
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={requireType}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-full font-semibold text-sm text-text-muted bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={!canConfirm}
            className={`flex-1 px-4 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 ${
              danger
                ? 'bg-gradient-to-r from-danger to-red-400 text-white hover:shadow-[0_0_20px_rgba(255,69,96,0.4)] disabled:opacity-30 disabled:hover:shadow-none'
                : 'btn-primary'
            } ${!canConfirm ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'}`}
          >
            {confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
