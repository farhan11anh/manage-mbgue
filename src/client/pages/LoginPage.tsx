import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = (location.state as { successMessage?: string } | null)?.successMessage;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && <p className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">{successMessage}</p>}
          <div>
            <label className="text-sm text-text-muted mb-1 block">Username</label>
            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password</label>
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
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
