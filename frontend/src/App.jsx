import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import OnboardingPage from './pages/OnboardingPage';
import AdminReviewPage from './pages/AdminReviewPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import InstitutionAdminDashboard from './pages/InstitutionAdminDashboard';
import InstitutionSelectPage from './pages/InstitutionSelectPage';
import InstitutionOnboardingPage from './pages/InstitutionOnboardingPage';
import DemoRequestPage from './pages/DemoRequestPage';
import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PublicProfilePage from './pages/PublicProfilePage';
import QuizPage from './pages/QuizPage';
import TeacherDashboard from './pages/TeacherDashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const SuperAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  // Super admin has no institution_id (or a special flag)
  if (user.role !== 'admin' || user.institution_id) return <Navigate to="/dashboard" replace />;
  return children;
};

const TeacherRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'teacher' && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/institution-select" element={<InstitutionSelectPage />} />
        <Route path="/institution-onboarding" element={<InstitutionOnboardingPage />} />
        <Route path="/demo-request" element={<DemoRequestPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/admin/review" element={<AdminReviewPage />} />
        <Route path="/admin/dashboard" element={<AdminRoute><InstitutionAdminDashboard /></AdminRoute>} />
        <Route path="/superadmin" element={<SuperAdminRoute><SuperAdminDashboard /></SuperAdminRoute>} />
        <Route path="/login"    element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/teacher" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
        <Route path="/profile/:userId" element={<PublicProfilePage />} />
        <Route path="/quiz/:groupId/:quizId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}