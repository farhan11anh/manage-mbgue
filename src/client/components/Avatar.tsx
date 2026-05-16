import { useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

declare global {
  interface Window {
    cloudinary?: any;
  }
}

const CLOUD_NAME = 'dlypxouu4';
const API_KEY = '318677542123615';

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
}

export default function Avatar({ size = 'md', editable = false, name }: AvatarProps) {
  const { user, setUser } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const displayName = name || user?.displayName || '?';
  const avatarUrl = user?.avatarUrl;

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

  const openUploadWidget = () => {
    setShowMenu(false);
    if (!window.cloudinary) {
      alert('Cloudinary widget belum dimuat. Coba refresh halaman.');
      return;
    }

    window.cloudinary.openUploadWidget(
      {
        cloudName: CLOUD_NAME,
        apiKey: API_KEY,
        uploadSignature: (callback: (sig: string) => void, params_to_sign: Record<string, any>) => {
          fetch('/api/auth/cloudinary-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ params_to_sign }),
            credentials: 'include',
          })
            .then(r => r.json())
            .then(data => callback(data.signature))
            .catch(() => alert('Gagal generate signature'));
        },
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        showSkipCropButton: false,
        multiple: false,
        maxFiles: 1,
        sources: ['local', 'camera', 'url'],
        folder: 'mbg-avatars',
        resourceType: 'image',
        clientAllowedFormats: ['png', 'jpg', 'jpeg', 'gif', 'webp'],
        maxImageFileSize: 5000000,
        cropping_default_selection_ratio: 0.8,
        theme: 'minimal',
        styles: {
          palette: {
            window: '#1a1a2e',
            windowBorder: '#00ff88',
            tabIcon: '#00ff88',
            menuIcons: '#aaaacc',
            textDark: '#1a1a2e',
            textLight: '#e0e0ff',
            link: '#00ff88',
            action: '#00ff88',
            inactiveTabIcon: '#666688',
            error: '#ff4466',
            inProgress: '#00ff88',
            complete: '#00ff88',
            sourceBg: '#16162a',
          },
        },
      },
      (error: any, result: any) => {
        if (error) return;
        if (result.event === 'success') {
          const url = result.info.secure_url;
          api.updateAvatar(url)
            .then(res => setUser(res.user))
            .catch(() => alert('Gagal menyimpan foto profil'));
        }
      }
    );
  };

  const handleDelete = async () => {
    setShowMenu(false);
    try {
      const updated = await api.deleteAvatar();
      setUser(updated.user);
    } catch {
      alert('Gagal menghapus foto');
    }
  };

  const handleClick = () => {
    if (!editable) return;
    if (avatarUrl) {
      setShowMenu(!showMenu);
    } else {
      openUploadWidget();
    }
  };

  return (
    <div className="relative group">
      <div onClick={handleClick} className={editable ? 'cursor-pointer' : ''}>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className={`${sizeClass} rounded-full object-cover border-2 border-primary/30`}
          />
        ) : (
          <div className={`${sizeClass} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-lg select-none`}>
            {initial}
          </div>
        )}

        {editable && (
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
      </div>

      {/* Context menu */}
      {showMenu && avatarUrl && editable && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 glass-card border border-white/10 rounded-xl py-1 min-w-[160px] z-50 shadow-2xl">
            <button
              onClick={openUploadWidget}
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
        </>
      )}
    </div>
  );
}
