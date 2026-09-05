import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import DashboardLayout from './components/templates/DashboardLayout';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import DashboardHome from './features/dashboard/DashboardHome';
import CowListPage from './features/cows/CowListPage';
import CowRegisterPage from './features/cows/CowRegisterPage';
import CowDetailPage from './features/cows/CowDetailPage';
import HealthPage from './features/health/HealthPage';
import OperationsPage from './features/operations/OperationsPage';
import GobarDhanPage from './features/operations/GobarDhanPage';
import DonationsPage from './features/donations/DonationsPage';
import DonatePage from './features/donations/DonatePage';
import VisitorsPage from './features/visitors/VisitorsPage';
import FinancePage from './features/finance/FinancePage';
import AIDashboardPage from './features/ai/AIDashboardPage';
import UsersPage from './features/users/UsersPage';
import PublicImpactPage from './features/impact/PublicImpactPage';
import AdoptPhotoWallPage from './features/impact/AdoptPhotoWallPage';
import PublicHomePage from './features/home/PublicHomePage';
import RescueCowPage from './features/cows/RescueCowPage';

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public route wrapper (redirect to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

function App() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/donate" element={<DonatePage />} />
        <Route path="/impact" element={<PublicImpactPage />} />
        <Route path="/adopt-wall" element={<AdoptPhotoWallPage />} />
        <Route path="/adopt" element={<AdoptPhotoWallPage />} />
        <Route path="/rescue" element={<RescueCowPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="cows" element={<CowListPage />} />
          <Route path="cows/register" element={<CowRegisterPage />} />
          <Route path="cows/:id" element={<CowDetailPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="operations" element={<OperationsPage />} />
          <Route path="gobar-dhan" element={<GobarDhanPage />} />
          <Route path="donations" element={<DonationsPage />} />
          <Route path="visitors" element={<VisitorsPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="ai" element={<AIDashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="rescue" element={<RescueCowPage />} />
        </Route>

        {/* Public Landing Homepage */}
        <Route path="/" element={<PublicHomePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
