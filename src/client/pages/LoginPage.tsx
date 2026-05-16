import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors = { username: '', password: '' };

    if (!username.trim()) {
      nextErrors.username = 'Username wajib diisi';
    }

    if (!password) {
      nextErrors.password = 'Password wajib diisi';
    }

    setFieldErrors(nextErrors);
    setError('');

    if (nextErrors.username || nextErrors.password) {
      return;
    }

    setLoading(true);
    try {
      await login(username.trim().toLowerCase(), password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login gagal');
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
          {successMessage && <p className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{successMessage}</p>}
          <div>
            <label className="text-sm text-text-muted mb-1 block">Username</label>
            <input className="input-field lowercase" value={username} onChange={e => { setUsername(e.target.value.toLowerCase()); setFieldErrors(prev => ({ ...prev, username: '' })); setError(''); }} autoComplete="username" />
            {fieldErrors.username && <p className="text-danger text-xs mt-1">{fieldErrors.username}</p>}
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password</label>
            <PasswordInput value={password} onChange={e => { setPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); setError(''); }} autoComplete="current-password" />
            {fieldErrors.password && <p className="text-danger text-xs mt-1">{fieldErrors.password}</p>}
          </div>
          {error && <p className="text-danger text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Belum punya akun?{' '}
          <Link to="/register" className="text-primary hover:underline">Daftar</Link>
        </p>
      </div>
    </div>
  );
}
