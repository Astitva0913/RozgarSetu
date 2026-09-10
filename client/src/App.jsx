import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import OtpPage from './pages/auth/OtpPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';

import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

import WorkerDashboard from './WorkerDashboard';
import WorkerProfilePage from './WorkerProfilePage';
import WorkerJobsPage from './WorkerJobsPage';
import WorkerJobDetailPage from './WorkerJobDetailPage';
import WorkerApplicationsPage from './WorkerApplicationsPage';

import CustomerDashboard from './CustomerDashboard';
import CustomerWorkersPage from './CustomerWorkersPage';
import CustomerJobsPage from './CustomerJobsPage';
import JobDetailPage from './JobDetailPage';

import AdminDashboard from './AdminDashboard';

import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-otp" element={<OtpPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* ==================== WORKER ROUTES ==================== */}

        <Route
          path="/worker"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['worker']}>
                <WorkerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/profile"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['worker']}>
                <WorkerProfilePage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/jobs"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['worker']}>
                <WorkerJobsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/jobs/:jobId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['worker']}>
                <WorkerJobDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/worker/applications"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['worker']}>
                <WorkerApplicationsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ==================== CUSTOMER ROUTES ==================== */}

        <Route
          path="/customer"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/workers"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <CustomerWorkersPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/jobs"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <CustomerJobsPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customer/jobs/:jobId"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['customer']}>
                <JobDetailPage />
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* ==================== ADMIN ROUTE ==================== */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </RoleRoute>
            </ProtectedRoute>
          }
        />
      </Routes>

      <Footer />
    </BrowserRouter>
  );
}

export default App;