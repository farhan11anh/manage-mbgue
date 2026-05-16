import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './lib/auth';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MenuProposalPage from './pages/MenuProposalPage';
import MenuDetailPage from './pages/MenuDetailPage';
import WeeklyPlanPage from './pages/WeeklyPlanPage';
import RecapPage from './pages/RecapPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-primary text-xl">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
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
        <Route path="/" element={<ProtectedRoute><Navbar /><DashboardPage /></ProtectedRoute>} />
        <Route path="/week/:id" element={<ProtectedRoute><Navbar /><WeeklyPlanPage /></ProtectedRoute>} />
        <Route path="/propose" element={<ProtectedRoute><Navbar /><MenuProposalPage /></ProtectedRoute>} />
        <Route path="/menus/:id" element={<ProtectedRoute><Navbar /><MenuDetailPage /></ProtectedRoute>} />
        <Route path="/recap/:weekId" element={<ProtectedRoute><Navbar /><RecapPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
