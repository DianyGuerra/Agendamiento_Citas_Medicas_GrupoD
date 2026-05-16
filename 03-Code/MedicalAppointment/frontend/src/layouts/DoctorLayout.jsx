import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { NotificationModel, AppointmentModel, PrescriptionModel, ScheduleModel, DoctorRatingModel } from '../models';
import {
  HomeIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  DocumentIcon,
  UserCircleIcon,
  BellIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  BeakerIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

// Storage key for tracking read notifications
const READ_NOTIFICATIONS_KEY = 'doctor_read_notifications';

export default function DoctorLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Function to calculate unread notification count
  const calculateUnreadCount = useCallback(async () => {
    try {
      const readNotifications = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
      let totalUnread = 0;
      const now = new Date();

      // Get appointments to count new ones
      try {
        const appointmentsResponse = await AppointmentModel.getDoctorAppointments({ 
          limit: 30,
          includeCancelled: 'true'
        });
        const appointments = appointmentsResponse?.data || appointmentsResponse || [];
        
        appointments.forEach(apt => {
          const createdAt = new Date(apt.created_at);
          const createdHoursAgo = (now - createdAt) / (1000 * 60 * 60);
          
          // New appointments in last 72 hours
          if ((apt.status_code === 'scheduled' || apt.status_code === 'confirmed') && createdHoursAgo <= 72) {
            const notifId = `apt-new-${apt.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
          
          // Cancelled in last 7 days
          if (apt.status_code === 'cancelled') {
            const cancelledAt = new Date(apt.updated_at || apt.created_at);
            const cancelledHoursAgo = (now - cancelledAt) / (1000 * 60 * 60);
            if (cancelledHoursAgo <= 168) {
              const notifId = `apt-cancel-${apt.id}`;
              if (!readNotifications.includes(notifId)) totalUnread++;
            }
          }
        });
      } catch (e) {
        console.log('[DoctorLayout] Could not fetch appointments for count');
      }

      // Get pending renewals
      try {
        const renewalsResponse = await PrescriptionModel.getRenewals({
          status: 'pending',
          limit: 20
        });
        const renewals = renewalsResponse?.data || renewalsResponse || [];
        renewals.forEach(r => {
          const notifId = `renewal-pending-${r.id}`;
          if (!readNotifications.includes(notifId)) totalUnread++;
        });
      } catch (e) {
        console.log('[DoctorLayout] Could not fetch renewals for count');
      }

      // Get recent ratings
      try {
        const ratingsResponse = await DoctorRatingModel.getByDoctor(user?.doctorId || user?.id, { limit: 10 });
        const ratings = ratingsResponse?.data || ratingsResponse || [];
        ratings.forEach(r => {
          const ratedAt = new Date(r.created_at);
          const ratedHoursAgo = (now - ratedAt) / (1000 * 60 * 60);
          if (ratedHoursAgo <= 168) {
            const notifId = `rating-${r.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
        });
      } catch (e) {
        console.log('[DoctorLayout] Could not fetch ratings for count');
      }

      // Get schedule exceptions
      try {
        const exceptionsResponse = await ScheduleModel.getMyExceptionRequests();
        const exceptions = Array.isArray(exceptionsResponse) ? exceptionsResponse : exceptionsResponse?.data || [];
        exceptions.forEach(exc => {
          const excDate = new Date(exc.reviewed_at || exc.created_at);
          const excHoursAgo = (now - excDate) / (1000 * 60 * 60);
          
          if (exc.status === 'pending') {
            const notifId = `schedule-pending-${exc.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          } else if ((exc.status === 'approved' || exc.status === 'rejected') && excHoursAgo <= 168) {
            const notifId = `schedule-${exc.status}-${exc.id}`;
            if (!readNotifications.includes(notifId)) totalUnread++;
          }
        });
      } catch (e) {
        console.log('[DoctorLayout] Could not fetch schedule exceptions for count');
      }

      // Get system notifications
      try {
        const dbNotifications = await NotificationModel.getUserNotifications({ limit: 30 });
        dbNotifications.forEach(n => {
          const notifId = `db-${n.id}`;
          if (!readNotifications.includes(notifId) && !n.is_read) totalUnread++;
        });
      } catch (e) {
        console.log('[DoctorLayout] Could not fetch system notifications for count');
      }

      setNotificationCount(totalUnread);
    } catch (error) {
      console.error('[DoctorLayout] Error calculating notification count:', error);
      // Fallback to localStorage value
      const storedCount = localStorage.getItem('doctor_unread_notifications_count');
      if (storedCount) {
        setNotificationCount(Number.parseInt(storedCount, 10) || 0);
      }
    }
  }, [user]);

  // Load notification count on mount and when location changes
  useEffect(() => {
    calculateUnreadCount();
    
    // Re-check periodically (every 60 seconds)
    const interval = setInterval(calculateUnreadCount, 60000);
    
    // Listen for custom event from notifications page
    const handleNotificationUpdate = (event) => {
      setNotificationCount(event.detail?.count || 0);
    };
    window.addEventListener('notificationCountUpdate', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notificationCountUpdate', handleNotificationUpdate);
    };
  }, [location.pathname, calculateUnreadCount]);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { path: '/doctor/dashboard', icon: HomeIcon, label: 'Inicio' },
    { path: '/doctor/appointments', icon: CalendarIcon, label: 'Mi Agenda' },
    { path: '/doctor/patients', icon: UserGroupIcon, label: 'Mis Pacientes' },
    { path: '/doctor/prescriptions', icon: DocumentIcon, label: 'Recetas' },
    { path: '/doctor/lab', icon: BeakerIcon, label: 'Laboratorio' },
    { path: '/doctor/schedule', icon: Cog6ToothIcon, label: 'Mi Horario' },
    { path: '/doctor/reports', icon: ChartBarIcon, label: 'Reportes' },
    { path: '/doctor/notifications', icon: BellIcon, label: 'Notificaciones', badge: notificationCount },
    { path: '/doctor/profile', icon: UserCircleIcon, label: 'Mi Perfil' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg flex flex-col transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <img 
              src="/logo.png" 
              alt="Clínica San Miguel" 
              className="h-12 sm:h-16 object-contain"
            />
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              <XMarkIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm flex-1">{item.label}</span>
                    {item.badge > 0 && (
                      <span className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-white text-blue-600'
                          : `${item.badgeColor || 'bg-red-500'} text-white`
                      }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden w-full">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-8 py-3 sm:py-4 sticky top-0 z-30">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Bars3Icon className="w-6 h-6 text-gray-600" />
              </button>
              <h1 className="text-lg sm:text-2xl font-semibold text-gray-800 truncate">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Doctor'}
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden sm:block text-gray-600 text-sm font-medium truncate max-w-[150px]">
                Dr. {user?.first_name} {user?.last_name}
              </span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm sm:text-base flex-shrink-0">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
