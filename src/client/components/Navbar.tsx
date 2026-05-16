import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import Avatar from './Avatar';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/10 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="font-heading font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MBG
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-text-muted hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/propose" className="text-text-muted hover:text-primary transition-colors">Usulkan Menu</Link>
          {user?.isAdmin ? <Link to="/admin" className="text-text-muted hover:text-primary transition-colors">Admin</Link> : null}
        </div>

        <div className="hidden md:flex items-center gap-3 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <Avatar size="sm" />
            <span className="text-sm">{user?.displayName}</span>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 glass-card p-2 min-w-[200px] border border-white/10 rounded-xl">
              <div className="flex items-center gap-3 px-3 py-3 border-b border-white/10 mb-1">
                <Avatar size="md" />
                <div>
                  <p className="text-sm font-semibold">{user?.displayName}</p>
                  <p className="text-xs text-text-muted">@{user?.username}</p>
                </div>
              </div>
              <Link
                to="/change-password"
                onClick={() => setDropdownOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm text-text-main hover:bg-white/5 rounded-lg transition-colors"
              >
                🔑 Ganti Password
              </Link>
              {user?.isAdmin ? (
                <Link
                  to="/admin"
                  onClick={() => setDropdownOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm text-text-main hover:bg-white/5 rounded-lg transition-colors"
                >
                  🛡️ Admin Dashboard
                </Link>
              ) : null}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-white/5 rounded-lg transition-colors"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>

        <button className="md:hidden text-text-main" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-3 space-y-2 pb-3">
          <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 mb-2">
            <Avatar size="md" />
            <div>
              <p className="text-sm font-semibold">{user?.displayName}</p>
              <p className="text-xs text-text-muted">@{user?.username}</p>
            </div>
          </div>
          <Link to="/" className="block px-3 py-2 text-text-muted hover:text-primary" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/propose" className="block px-3 py-2 text-text-muted hover:text-primary" onClick={() => setMenuOpen(false)}>Usulkan Menu</Link>
          <Link to="/change-password" className="block px-3 py-2 text-text-muted hover:text-primary" onClick={() => setMenuOpen(false)}>Ganti Password</Link>
          {user?.isAdmin ? <Link to="/admin" className="block px-3 py-2 text-text-muted hover:text-primary" onClick={() => setMenuOpen(false)}>Admin</Link> : null}
          <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-danger">Logout</button>
        </div>
      )}
    </nav>
  );
}
