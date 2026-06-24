import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

// Layout
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginRegister from './pages/LoginRegister';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import CasesList from './pages/CasesList';
import CaseDetails from './pages/CaseDetails';
import HearingsCalendar from './pages/HearingsCalendar';
import VideoHearing from './pages/VideoHearing';
import FileCase from './pages/FileCase';
import AdminUsers from './pages/AdminUsers';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminAuditLogs from './pages/AdminAuditLogs';

// Protected Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginRegister />} />

      {/* Protected Layout Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Profile />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/new"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'lawyer', 'admin']}>
            <DashboardLayout>
              <FileCase />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CasesList />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/cases/:id"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <CaseDetails />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hearings"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <HearingsCalendar />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/hearings/:hearingId/room"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <VideoHearing />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin Specific Routes */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminUsers />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminAnalytics />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout>
              <AdminAuditLogs />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch All Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
