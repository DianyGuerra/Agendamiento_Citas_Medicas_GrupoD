import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationModel, AppointmentModel, PrescriptionModel, MedicalRecordModel, BillingModel } from '../models';
import {
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';

// Storage key for tracking read notifications
const READ_NOTIFICATIONS_KEY = 'patient_read_notifications';

export default function PatientLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Function to calculate unread notification count
  const calculateUnreadCount = useCallback(async () => {
    try {
      const readNotifications = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
      let totalUnread = 0;
      const now = new Date();

      // Get appointments for notifications
      try {
        const appointmentsResponse = await AppointmentModel.getPatientAppointments({ limit: 30 });
        const appointments = appointmentsResponse?.data || appointmentsResponse || [];
        
        appointments.forEach(apt => {
          // Confirmed appointments
          if (apt.status_code === 'scheduled' || apt.status_code === 'confirmed') {
            const notifId = `apt-confirmed-${apt.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
            
            // Reminder for upcoming
            const aptDate = new Date(apt.scheduled_start);
            const hoursUntil = (aptDate - now) / (1000 * 60 * 60);
            if (hoursUntil > 0 && hoursUntil <= 48) {
              const reminderNotifId = `apt-reminder-${apt.id}`;
              if (!readNotifications.includes(reminderNotifId)) totalUnread++;
            }
          }
          
          // Cancelled appointments
          if (apt.status_code === 'cancelled') {
            const notifId = `apt-cancelled-${apt.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
        });
      } catch (e) {
        console.log('[PatientLayout] Could not fetch appointments for count');
      }

      // Get renewal notifications
      try {
        const renewalsResponse = await PrescriptionModel.getRenewals({ limit: 10 });
        const renewals = renewalsResponse?.data || renewalsResponse || [];
        renewals.forEach(r => {
          const reviewDate = new Date(r.reviewed_at || r.updated_at || r.created_at);
          const hoursAgo = (now - reviewDate) / (1000 * 60 * 60);
          
          if (r.status === 'approved' || r.status === 'rejected') {
            if (hoursAgo <= 168) {
              const notifId = `renewal-${r.status}-${r.id}`;
              if (!readNotifications.includes(notifId)) totalUnread++;
            }
          } else if (r.status === 'pending') {
            const notifId = `renewal-pending-${r.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
        });
      } catch (e) {
        console.log('[PatientLayout] Could not fetch renewals for count');
      }

      // Get lab results
      try {
        const labReportsResponse = await MedicalRecordModel.getLabReports();
        const labReports = labReportsResponse?.data || labReportsResponse || [];
        labReports.forEach(report => {
          const reportDate = new Date(report.created_at);
          const hoursAgo = (now - reportDate) / (1000 * 60 * 60);
          if (report.status === 'completed' && hoursAgo <= 168) {
            const notifId = `lab-ready-${report.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
        });
      } catch (e) {
        console.log('[PatientLayout] Could not fetch lab reports for count');
      }

      // Get billing notifications
      try {
        const billingsResponse = await BillingModel.getAll({ limit: 20 });
        const billings = billingsResponse?.data || billingsResponse || [];
        billings.forEach(billing => {
          const billingDate = new Date(billing.created_at);
          const hoursAgo = (now - billingDate) / (1000 * 60 * 60);
          if (billing.status === 'pending' && hoursAgo <= 168) {
            const notifId = `billing-new-${billing.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
        });
      } catch (e) {
        console.log('[PatientLayout] Could not fetch billings for count');
      }

      // Get system notifications
      try {
        const dbNotifications = await NotificationModel.getUserNotifications({ limit: 20 });
        dbNotifications.forEach(n => {
          const notifId = `db-${n.id}`;
          if (!readNotifications.includes(notifId) && !n.is_read) totalUnread++;
        });
      } catch (e) {
        console.log('[PatientLayout] Could not fetch system notifications for count');
      }

      setNotificationCount(totalUnread);
    } catch (error) {
      console.error('[PatientLayout] Error calculating notification count:', error);
      // Fallback to localStorage value
      const storedCount = localStorage.getItem('patient_unread_notifications_count');
      if (storedCount) {
        setNotificationCount(Number.parseInt(storedCount, 10) || 0);
      }
    }
  }, []);

  // Load notification count on mount and when location changes
  useEffect(() => {
    calculateUnreadCount();
    
    // Re-check periodically (every 60 seconds)
    const interval = setInterval(calculateUnreadCount, 60000);
    
    // Listen for custom event from notifications page
    const handleNotificationUpdate = (event) => {
      setNotificationCount(event.detail?.count || 0);
    };
    window.addEventListener('patientNotificationCountUpdate', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('patientNotificationCountUpdate', handleNotificationUpdate);
    };
  }, [location.pathname, calculateUnreadCount]);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { 
      path: '/patient/dashboard', 
      icon: HomeIcon, 
      label: 'Inicio' 
    },
    { 
      path: '/patient/appointments', 
      icon: CalendarIcon, 
      label: 'Mis Citas' 
    },
    { 
      path: '/patient/history', 
      icon: ClipboardDocumentListIcon, 
      label: 'Historial Médico' 
    },
    { 
      path: '/patient/lab', 
      icon: BeakerIcon, 
      label: 'Resultados de Lab' 
    },
    { 
      path: '/patient/prescriptions', 
      icon: DocumentTextIcon, 
      label: 'Recetas Médicas' 
    },
    { 
      path: '/patient/billing', 
      icon: CurrencyDollarIcon, 
      label: 'Mis Facturas' 
    },
    { 
      path: '/patient/notifications', 
      icon: BellIcon, 
      label: 'Notificaciones' 
    },
    { 
      path: '/patient/profile', 
      icon: UserCircleIcon, 
      label: 'Mi Perfil' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Sidebar para Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-blue-700 pt-5 pb-4 overflow-y-auto">
          {/* Logo con Imagen - MÁS GRANDE */}
          <div className="flex items-center justify-center flex-shrink-0 px-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-lg w-full">
              <img 
                src="/logo.png" 
                alt="Clínica San Miguel" 
                className="h-20 w-full object-contain"
              />
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center px-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 w-full border border-white/30">
              <div className="flex items-center gap-3">
                <div className="bg-white text-blue-600 rounded-full p-2 w-12 h-12 flex items-center justify-center font-bold text-lg">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-blue-100 truncate">Paciente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             location.pathname.startsWith(item.path + '/');
              const isNotifications = item.path === '/patient/notifications';
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-blue-600' : 'text-blue-200'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{item.label}</span>
                  {isNotifications && notificationCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white min-w-[20px]">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="flex-shrink-0 px-2 pb-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-3 text-sm font-medium text-blue-100 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Clínica San Miguel" 
              className="h-10 object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col z-50 lg:hidden">
            <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-blue-700 pt-20 pb-4 overflow-y-auto">
              {/* Logo con Imagen en Mobile - MÁS GRANDE */}
              <div className="flex items-center justify-center flex-shrink-0 px-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-lg w-full">
                  <img 
                    src="/logo.png" 
                    alt="Clínica San Miguel" 
                    className="h-16 w-full object-contain"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center px-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 w-full border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-white text-blue-600 rounded-full p-2 w-12 h-12 flex items-center justify-center font-bold text-lg">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-blue-100 truncate">Paciente</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                                 location.pathname.startsWith(item.path + '/');
                  const isNotifications = item.path === '/patient/notifications';
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-blue-600' : 'text-blue-200'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{item.label}</span>
                      {isNotifications && notificationCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white min-w-[20px]">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="flex-shrink-0 px-2 pb-4">
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center px-3 py-3 text-sm font-medium text-blue-100 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200"
                >
                  <ArrowRightOnRectangleIcon
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    aria-hidden="true"
                  />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1 w-full min-w-0 overflow-x-hidden" style={{ maxWidth: '100vw' }}>
        <main className="flex-1 w-full min-w-0 overflow-x-hidden">
          <div className="py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6 w-full min-w-0 overflow-x-hidden">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center text-sm text-gray-600">
            <p>
              © {new Date().getFullYear()} MediCare - Sistema de Gestión de Citas Médicas
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
