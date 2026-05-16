import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import PasswordInput from '../components/PasswordInput';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ displayName: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedDisplayName = displayName.trim();
    const trimmedUsername = username.trim();
    const nextErrors = { displayName: '', username: '', password: '' };

    if (!trimmedDisplayName) {
      nextErrors.displayName = 'Nama tampilan wajib diisi';
    }

    if (!trimmedUsername) {
      nextErrors.username = 'Username wajib diisi';
    } else if (trimmedUsername.length < 3) {
      nextErrors.username = 'Username minimal 3 karakter';
    }

    if (password.length < 6) {
      nextErrors.password = 'Password minimal 6 karakter';
    }

    setFieldErrors(nextErrors);
    setError('');

    if (nextErrors.displayName || nextErrors.username || nextErrors.password) {
      return;
    }

    setLoading(true);
    try {
      const message = await register(trimmedUsername.toLowerCase(), password, trimmedDisplayName);
      navigate('/login', { state: { successMessage: message } });
    } catch (err: any) {
      setError(err.message || 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <span className="text-5xl mb-3 block">🥗</span>
          <h1 className="font-heading font-extrabold text-3xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
            MBG
          </h1>
          <p className="text-text-muted text-sm mt-1">Makanan Bergizi Guys</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Nama Tampilan</label>
            <input className="input-field" value={displayName} onChange={e => { setDisplayName(e.target.value); setFieldErrors(prev => ({ ...prev, displayName: '' })); setError(''); }} />
            {fieldErrors.displayName && <p className="text-danger text-xs mt-1">{fieldErrors.displayName}</p>}
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Username</label>
            <input className="input-field lowercase" value={username} onChange={e => { setUsername(e.target.value.toLowerCase()); setFieldErrors(prev => ({ ...prev, username: '' })); setError(''); }} autoComplete="username" />
            {fieldErrors.username && <p className="text-danger text-xs mt-1">{fieldErrors.username}</p>}
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password (min. 6 karakter)</label>
            <PasswordInput value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); setError(''); }} autoComplete="new-password" />
            {fieldErrors.password && <p className="text-danger text-xs mt-1">{fieldErrors.password}</p>}
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Mendaftar...' : 'Daftar'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-primary hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
