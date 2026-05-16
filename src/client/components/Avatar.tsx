import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import ImageCropModal from './ImageCropModal';

const IMGBB_API_KEY = '594b8294eee31f6d60345a04f65fb330';

// Generate consistent gradient from name
const GRADIENTS = [
  'from-emerald-400 to-cyan-500',
  'from-violet-500 to-purple-600',
  'from-rose-400 to-pink-600',
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-600',
  'from-lime-400 to-green-600',
  'from-fuchsia-400 to-pink-500',
  'from-teal-400 to-emerald-500',
  'from-indigo-400 to-violet-500',
  'from-red-400 to-rose-500',
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
  name?: string;
  url?: string | null;
}

export default function Avatar({ size = 'md', editable = false, name, url }: AvatarProps) {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = name || user?.displayName || '?';
  const avatarUrl = url !== undefined ? url : user?.avatarUrl;

  const sizeClass = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-24 h-24 text-3xl',
  }[size];

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-8 h-8',
  }[size];

  const gradient = getGradient(displayName);
  const initial = displayName.charAt(0).toUpperCase();

  const uploadBlob = async (blob: Blob) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', blob);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error('Upload gagal');

      const newUrl = data.data.display_url;
      const updated = await api.updateAvatar(newUrl);
      setUser(updated.user);
    } catch (e: any) {
      alert(e.message || 'Gagal upload foto');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB');
        return;
      }
      setCropFile(file);
    }
    e.target.value = '';
  };

  const handleCropConfirm = (croppedBlob: Blob) => {
    setCropFile(null);
    uploadBlob(croppedBlob);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      const updated = await api.deleteAvatar();
      setUser(updated.user);
    } catch (e: any) {
      alert(e.message || 'Gagal menghapus foto');
    }
  };

  return (
    <>
      <div className="relative group">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className={`${sizeClass} rounded-full object-cover border-2 border-primary/30`}
          />
        ) : (
          <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg`}>
            {initial}
          </div>
        )}

        {editable && (
          <>
            <button
              onClick={() => avatarUrl ? setShowMenu(!showMenu) : fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {uploading ? (
                <span className="text-white text-xs animate-spin">⏳</span>
              ) : (
                <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>

            {/* Context menu: change or delete */}
            {showMenu && avatarUrl && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 glass-card border border-white/10 rounded-xl py-1 min-w-[150px] z-50 shadow-2xl">
                <button
                  onClick={() => { setShowMenu(false); fileRef.current?.click(); }}
                  className="w-full text-left px-3 py-2 text-sm text-text-main hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Ganti Foto
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Hapus Foto
                </button>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>

      {/* Crop Modal */}
      {cropFile && (
        <ImageCropModal
          imageFile={cropFile}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropFile(null)}
        />
      )}
    </>
  );
}
