import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LiveMonitor from './pages/LiveMonitor';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Admin from './pages/Admin';
import Agents from './pages/Agents';
import SystemAudit from './pages/SystemAudit';
import Billing from './pages/Billing';
import Settings from './pages/Settings';
import EmployeeDashboard from './pages/EmployeeDashboard';
import CentralServer from './pages/CentralServer';
import MailProcessing from './pages/MailProcessing';
import IcapServer from './pages/IcapServer';
import ImageRecognition from './pages/ImageRecognition';
import SpeechRecognition from './pages/SpeechRecognition';
import Vulnerabilities from './pages/Vulnerabilities';
import Login from './pages/Login';
import Policies from './pages/Policies';
import Reports from './pages/Reports';
import Productivity from './pages/Productivity';
import Register from './pages/Register';
import Landing from './pages/Landing';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

import { useEffect } from 'react';
import { Analytics } from './services/analytics';
import { useLocation } from 'react-router-dom';

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    Analytics.init();
  }, []);

  useEffect(() => {
    Analytics.track('Page View', {
      path: location.pathname,
      search: location.search
    });
  }, [location]);

  return null;
}

import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Dashboard Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/status" element={<Dashboard />} />
                <Route path="/central-server" element={<CentralServer />} />
                <Route path="/users" element={<Admin />} />
                <Route path="/tenants" element={<Tenants />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/mail" element={<MailProcessing />} />
                <Route path="/icap" element={<IcapServer />} />
                <Route path="/image-recognition" element={<ImageRecognition />} />
                <Route path="/speech-recognition" element={<SpeechRecognition />} />
                <Route path="/vulnerabilities" element={<Vulnerabilities />} />
                <Route path="/events" element={<LiveMonitor />} />
                <Route path="/policies" element={<Policies />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/audit" element={<SystemAudit />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/my-dashboard" element={<EmployeeDashboard />} />
                <Route path="/productivity" element={<Productivity />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider >
  );
}

export default App;
