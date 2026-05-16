import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const isForcedChange = !!user?.mustChangePassword;
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    if (!isForcedChange && !oldPassword) {
      setError('Password lama wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await api.changePassword(isForcedChange ? { newPassword } : { oldPassword, newPassword });
      setUser(res.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="glass-card p-8">
        <div className="mb-8 text-center">
          <span className="text-5xl mb-3 block">🔐</span>
          <h1 className="font-heading font-extrabold text-3xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            Ganti Password
          </h1>
          <p className="text-text-muted text-sm mt-2">
            {isForcedChange
              ? 'Password Anda di-reset oleh admin. Silakan buat password baru.'
              : 'Perbarui password akun Anda untuk menjaga keamanan akses MBG.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isForcedChange && (
            <div>
              <label className="text-sm text-text-muted mb-1 block">Password Lama</label>
              <input
                className="input-field"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required={!isForcedChange}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-text-muted mb-1 block">Password Baru</label>
            <input
              className="input-field"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="text-sm text-text-muted mb-1 block">Konfirmasi Password Baru</label>
            <input
              className="input-field"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={6}
              required
            />
          </div>

          {error && <p className="text-danger text-sm">{error}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 min-w-[180px]">
              {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
            {!isForcedChange && (
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1 min-w-[140px]">
                Batal
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
