import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, password, displayName);
      navigate('/');
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-text-muted mb-1 block">Nama Tampilan</label>
            <input className="input-field" value={displayName} onChange={e => setDisplayName(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Username</label>
            <input className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password (min. 6 karakter)</label>
            <input className="input-field" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
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
