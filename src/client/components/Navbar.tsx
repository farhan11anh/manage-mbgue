import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-card border-b border-white/10 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="font-heading font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            MBG
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-text-muted hover:text-primary transition-colors">Dashboard</Link>
          <Link to="/propose" className="text-text-muted hover:text-primary transition-colors">Usulkan Menu</Link>
        </div>

        {/* User dropdown */}
        <div className="hidden md:flex items-center gap-3 relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-accent flex items-center justify-center text-sm font-bold text-bg-dark">
              {user?.displayName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm">{user?.displayName}</span>
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 glass-card p-2 min-w-[150px] border border-white/10 rounded-xl">
              <button
                onClick={() => { logout(); setDropdownOpen(false); }}
                className="w-full text-left px-3 py-2 text-sm text-danger hover:bg-white/5 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-text-main" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-3 space-y-2 pb-3">
          <Link to="/" className="block px-3 py-2 text-text-muted hover:text-primary" onClick={() => setMenuOpen(false)}>Dashboard</Link>
          <Link to="/propose" className="block px-3 py-2 text-text-muted hover:text-primary" onClick={() => setMenuOpen(false)}>Usulkan Menu</Link>
          <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full text-left px-3 py-2 text-danger">Logout</button>
        </div>
      )}
    </nav>
  );
}
