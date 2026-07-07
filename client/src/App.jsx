import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';

// Auth Pages
import Login from './pages/auth/Login';
import RegisterCompany from './pages/auth/RegisterCompany';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// App Pages
import Dashboard from './pages/dashboard/Dashboard';
import LeadList from './pages/leads/LeadList';
import LeadDetail from './pages/leads/LeadDetail';
import UserList from './pages/users/UserList';
import CompanySettings from './pages/settings/CompanySettings';

// CRM Pages
import CrmDashboard from './pages/crm/CrmDashboard';
import CreateLeadPage from './pages/crm/CreateLeadPage';
import Meetings from './pages/crm/Meetings';
import ConvertedLeads from './pages/crm/ConvertedLeads';
import LostLeads from './pages/crm/LostLeads';
import PipelineBoard from './pages/crm/PipelineBoard';

export default function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterCompany />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                {/* Main Routes */}
                <Route path="/" element={<Dashboard />} />
                <Route path="/leads" element={<LeadList />} />
                <Route path="/leads/:id" element={<LeadDetail />} />
                <Route path="/users" element={<UserList />} />
                <Route path="/settings" element={<CompanySettings />} />

                {/* CRM Routes */}
                <Route path="/crm/dashboard" element={<CrmDashboard />} />
                <Route path="/crm/pipeline" element={<PipelineBoard />} />
                <Route path="/crm/leads/new" element={<CreateLeadPage />} />
                <Route path="/crm/meetings" element={<Meetings />} />
                <Route path="/crm/leads/converted" element={<ConvertedLeads />} />
                <Route path="/crm/leads/lost" element={<LostLeads />} />
                <Route path="/crm/leads" element={<LeadList />} />
                <Route path="/crm" element={<Navigate to="/crm/dashboard" replace />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}
