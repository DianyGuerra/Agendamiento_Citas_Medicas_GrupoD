import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Public pages (refactored with Clean Code structure)
import Home from './pages/public/Home';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import ForgotPassword from './pages/public/ForgotPassword';
import ResetPassword from './pages/public/ResetPassword';
import CompleteProfile from './pages/public/CompleteProfile';
import ConfirmAppointment from './pages/public/ConfirmAppointment';
import AuthCallback from './pages/public/AuthCallback';
import VerifyPrescriptionQR from './pages/VerifyPrescriptionQR';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import DoctorManagement from './pages/admin/DoctorManagement.jsx';
import PatientManagement from './pages/admin/PatientManagement.jsx';
import SpecialtyManagement from './pages/admin/SpecialtyManagement';
import ScheduleManagement from './pages/admin/ScheduleManagement';
import ConsultationRoomManagement from './pages/admin/ConsultationRoomManagement';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminProfile from './pages/admin/AdminProfile';
import AdminLogs from './pages/admin/AdminLogs';
import BillingManagement from './pages/admin/BillingManagement';
import InsuranceManagement from './pages/admin/InsuranceManagement';
import LaboratoryManagement from './pages/admin/LaboratoryManagement';
import ConsultationsManagement from './pages/admin/ConsultationsManagement';
import QualityManagement from './pages/admin/QualityManagement';
import NotificationsManagement from './pages/admin/NotificationsManagement';
import SecurityManagement from './pages/admin/SecurityManagement';

// Patient pages (refactored with Clean Code structure)
import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import NewAppointment from './pages/patient/NewAppointment';
import PatientNotifications from './pages/patient/Notifications';
import MedicalRecord from './pages/patient/Record';
import PatientHistory from './pages/patient/History';
import PatientLab from './pages/patient/Lab';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientProfile from './pages/patient/Profile';
import RateAppointment from './pages/patient/Rate';
import PatientBilling from './pages/patient/Billing';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorPatients from './pages/doctor/DoctorPatients';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorConsultation from './pages/doctor/DoctorConsultation';
import DoctorSchedule from './pages/doctor/DoctorSchedule';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorPrescriptions from './pages/doctor/DoctorPrescriptions';
import DoctorNotifications from './pages/doctor/DoctorNotifications';
import DoctorLab from './pages/doctor/DoctorLab';
import DoctorReports from './pages/doctor/DoctorReports';

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their proper dashboard
    const roleRoutes = {
      patient: '/patient/dashboard',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={roleRoutes[user.role] || '/'} replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/verify-prescription/:qrToken" element={<VerifyPrescriptionQR />} />
      <Route path="/confirm-appointment/:appointmentId" element={<ConfirmAppointment />} />
      <Route 
        path="/login" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={user ? <Navigate to={`/${user.role}/dashboard`} replace /> : <Register />} 
      />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/doctors"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DoctorManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/specialties"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SpecialtyManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ScheduleManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/calendar"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCalendar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/consultation-rooms"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ConsultationRoomManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/logs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLogs />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/patients"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PatientManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/billing"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <BillingManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/insurance"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <InsuranceManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/laboratory"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LaboratoryManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/consultations"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ConsultationsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/quality"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <QualityManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <NotificationsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/security"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SecurityManagement />
          </ProtectedRoute>
        }
      />

      {/* Patient Routes */}
      <Route
        path="/patient/dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/appointments"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/new-appointment"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <NewAppointment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/medical-record"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <MedicalRecord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/history"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientHistory />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/lab"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientLab />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientPrescriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/notifications"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/profile"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/rate/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <RateAppointment />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/billing"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientBilling />
          </ProtectedRoute>
        }
      />

      {/* Doctor Routes */}
      <Route
        path="/doctor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/patients"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPatients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/appointments"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorAppointments />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/schedule"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorSchedule />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/profile"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/prescriptions"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorPrescriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/reports"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorReports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/notifications"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/lab"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorLab />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor/consultation/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorConsultation />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;