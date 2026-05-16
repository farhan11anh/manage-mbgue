import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MenuCatalogPage from './pages/MenuProposalPage';
import MenuDetailPage from './pages/MenuDetailPage';
import WeeklyPlanPage from './pages/WeeklyPlanPage';
import RecapPage from './pages/RecapPage';
import AdminPage from './pages/AdminPage';
import ChangePasswordPage from './pages/ChangePasswordPage';

function LoadingScreen() {
  return <div className="flex items-center justify-center h-screen"><div className="text-primary text-xl">Loading...</div></div>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function ForceChangePasswordRedirect({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function ProtectedShell({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  return (
    <ProtectedRoute>
      <ForceChangePasswordRedirect>
        <Navbar />
        {adminOnly ? <AdminRoute>{children}</AdminRoute> : children}
      </ForceChangePasswordRedirect>
    </ProtectedRoute>
  );
}

export default function App() {
  const { checkAuth } = useAuth();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedShell><DashboardPage /></ProtectedShell>} />
        <Route path="/week/:id" element={<ProtectedShell><WeeklyPlanPage /></ProtectedShell>} />
        <Route path="/catalog" element={<ProtectedShell><MenuCatalogPage /></ProtectedShell>} />
        <Route path="/menus/:id" element={<ProtectedShell><MenuDetailPage /></ProtectedShell>} />
        <Route path="/recap/:weekId" element={<ProtectedShell><RecapPage /></ProtectedShell>} />
        <Route path="/admin" element={<ProtectedShell adminOnly><AdminPage /></ProtectedShell>} />
        <Route path="/change-password" element={<ProtectedShell><ChangePasswordPage /></ProtectedShell>} />
      </Routes>
    </BrowserRouter>
  );
}
