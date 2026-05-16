import { useState, useRef } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

const IMGBB_API_KEY = '594b8294eee31f6d60345a04f65fb330';

interface AvatarProps {
  size?: 'sm' | 'md' | 'lg';
  editable?: boolean;
}

export default function Avatar({ size = 'md', editable = false }: AvatarProps) {
  const { user, setUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sizeClass = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-24 h-24 text-3xl',
  }[size];

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!data.success) throw new Error('Upload gagal');

      const avatarUrl = data.data.display_url;
      const updated = await api.updateAvatar(avatarUrl);
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
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      handleUpload(file);
    }
  };

  const initial = user?.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <div className="relative group">
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.displayName}
          className={`${sizeClass} rounded-full object-cover border-2 border-primary/30`}
        />
      ) : (
        <div className={`${sizeClass} rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center font-bold text-bg-dark`}>
          {initial}
        </div>
      )}

      {editable && (
        <>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          >
            {uploading ? (
              <span className="text-white text-xs">⏳</span>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
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
  );
}
