import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import LiveMonitor from './pages/LiveMonitor';
import Dashboard from './pages/Dashboard';
import Tenants from './pages/Tenants';
import Agents from './pages/Agents';
import Admin from './pages/Admin';
import CentralServer from './pages/CentralServer';
import MailProcessing from './pages/MailProcessing';
import IcapServer from './pages/IcapServer';
import ImageRecognition from './pages/ImageRecognition';
import SpeechRecognition from './pages/SpeechRecognition';
import Login from './pages/Login';
import Policies from './pages/Policies';
import Reports from './pages/Reports';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout />}>
              {/* Default to Status Monitor (Dashboard) */}
              <Route index element={<Navigate to="/status" replace />} />

              <Route path="status" element={<Dashboard />} />
              <Route path="central-server" element={<CentralServer />} />
              <Route path="users" element={<Admin />} />
              <Route path="tenants" element={<Tenants />} />
              <Route path="agents" element={<Agents />} />
              <Route path="mail" element={<MailProcessing />} />
              <Route path="icap" element={<IcapServer />} />
              <Route path="image-recognition" element={<ImageRecognition />} />
              <Route path="speech-recognition" element={<SpeechRecognition />} />
              <Route path="events" element={<LiveMonitor />} />
              <Route path="policies" element={<Policies />} />
              <Route path="reports" element={<Reports />} /> {/* Added Reports route */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
