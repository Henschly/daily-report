import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/dashboard/Dashboard';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import HRDashboard from './pages/dashboard/HRDashboard';
import HODDashboard from './pages/dashboard/HODDashboard';
import Reports from './pages/reports/Reports';
import ReportEditor from './pages/reports/ReportEditor';
import ReportView from './pages/reports/ReportView';
import CompiledReports from './pages/reports/CompiledReports';
import Settings from './pages/settings/Settings';
import Layout from './components/layout/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;

  switch (user.role) {
    case 'hr':
    case 'admin':
      return <HRDashboard />;
    case 'hod':
      return <HODDashboard />;
    default:
      return <StaffDashboard />;
  }
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardRouter />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/new" element={<ReportEditor />} />
        <Route path="reports/:id" element={<ReportView />} />
        <Route path="reports/:id/edit" element={<ReportEditor />} />
        <Route path="compiled-reports" element={<CompiledReports />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
