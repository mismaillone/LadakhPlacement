import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';
import JobListing from './pages/JobListing';
import JobDetails from './pages/JobDetails';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CreateJob from './pages/admin/CreateJob';
import EditJob from './pages/admin/EditJob';
import ViewApplications from './pages/admin/ViewApplications';
import ApplicationDetails from './pages/admin/ApplicationDetails';
import { AuthProvider } from './contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<JobListing />} />
            <Route path="jobs/:jobId" element={<JobDetails />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="login" element={<AdminLogin />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="jobs/new" element={<CreateJob />} />
            <Route path="jobs/edit/:jobId" element={<EditJob />} />
            <Route path="applications" element={<ViewApplications />} />
            <Route path="applications/:applicationId" element={<ApplicationDetails />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
