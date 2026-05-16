import React, { useState, useEffect, useCallback } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { AppointmentModel, PrescriptionModel, NotificationModel, ScheduleModel, DoctorRatingModel } from '../../models';
import { useAuth } from '../../context/AuthContext';
import { 
  BellIcon, 
  CalendarIcon, 
  XCircleIcon, 
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  CheckIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  MegaphoneIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

// Storage keys for persistence
const READ_NOTIFICATIONS_KEY = 'doctor_read_notifications';
const DELETED_NOTIFICATIONS_KEY = 'doctor_deleted_notifications';

/**
 * Get time ago string from date
 */
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  return past.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Notification type configuration
 */
const NOTIFICATION_TYPES = {
  new_appointment: {
    icon: CalendarIcon,
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Nueva Cita'
  },
  cancelled_appointment: {
    icon: XCircleIcon,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Cita Cancelada'
  },
  prescription_renewal: {
    icon: ArrowPathIcon,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Solicitud de Renovación'
  },
  renewal_pending: {
    icon: ClipboardDocumentCheckIcon,
    bgColor: 'bg-orange-100',
    iconColor: 'text-orange-600',
    label: 'Renovación Pendiente'
  },
  rating: {
    icon: StarIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Nueva Calificación'
  },
  appointment_today: {
    icon: CalendarIcon,
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Cita Hoy'
  },
  schedule_approved: {
    icon: CheckCircleIcon,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Horario Aprobado'
  },
  schedule_rejected: {
    icon: XCircleIcon,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Horario Rechazado'
  },
  schedule_pending: {
    icon: ClockIcon,
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Solicitud Pendiente'
  },
  announcement: {
    icon: MegaphoneIcon,
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    label: 'Anuncio'
  },
  system: {
    icon: BellIcon,
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    label: 'Sistema'
  }
};

export default function DoctorNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [toast, setToast] = useState(null);
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedNotifications, setDeletedNotifications] = useState(() => {
    const saved = localStorage.getItem(DELETED_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  /**
   * Format date for display
   */
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Generate notifications from various sources
   */
  const generateNotifications = useCallback(async () => {
    const generatedNotifications = [];
    const now = new Date();

    try {
      // Fetch appointments for this doctor
      const appointmentsResponse = await AppointmentModel.getAll({
        doctor_id: user?.doctorId || user?.id,
        limit: 50,
        sort: 'created_at:desc',
        includeCancelled: 'true'
      });

      const appointments = appointmentsResponse?.data || appointmentsResponse || [];

      appointments.forEach(apt => {
        const aptDate = new Date(apt.scheduled_start);
        const timeDiff = aptDate - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        const patientName = apt.patient?.user?.first_name 
          ? `${apt.patient.user.first_name} ${apt.patient.user.last_name}`
          : apt.patient_first_name || 'Paciente';

        // New appointments scheduled (created in last 72 hours, upcoming)
        if ((apt.status === 'scheduled' || apt.status === 'confirmed') && hoursDiff > 0) {
          const createdAt = new Date(apt.created_at);
          const createdHoursAgo = (now - createdAt) / (1000 * 60 * 60);
          
          if (createdHoursAgo <= 72) {
            generatedNotifications.push({
              id: `apt-new-${apt.id}`,
              type: 'new_appointment',
              title: 'Nueva cita agendada',
              message: `${patientName} ha agendado una cita para el ${formatDate(apt.scheduled_start)}`,
              date: apt.created_at,
              relatedId: apt.id,
              relatedType: 'appointment'
            });
          }
        }

        // Today's appointments reminder
        if ((apt.status === 'scheduled' || apt.status === 'confirmed') && 
            hoursDiff > 0 && hoursDiff <= 24) {
          generatedNotifications.push({
            id: `apt-today-${apt.id}`,
            type: 'appointment_today',
            title: 'Cita programada para hoy',
            message: `Tienes una cita con ${patientName} a las ${new Date(apt.scheduled_start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
            date: new Date().toISOString(),
            relatedId: apt.id,
            relatedType: 'appointment'
          });
        }

        // Cancelled appointments
        if (apt.status === 'cancelled') {
          const cancelledAt = new Date(apt.updated_at || apt.created_at);
          const cancelledHoursAgo = (now - cancelledAt) / (1000 * 60 * 60);
          
          if (cancelledHoursAgo <= 168) { // Last 7 days
            generatedNotifications.push({
              id: `apt-cancel-${apt.id}`,
              type: 'cancelled_appointment',
              title: 'Cita cancelada',
              message: `${patientName} ha cancelado su cita del ${formatDate(apt.scheduled_start)}${apt.cancellation_reason ? `. Motivo: ${apt.cancellation_reason}` : ''}`,
              date: apt.updated_at || apt.created_at,
              relatedId: apt.id,
              relatedType: 'appointment'
            });
          }
        }
      });

      // Fetch pending prescription renewals for this doctor
      try {
        const renewalsResponse = await PrescriptionModel.getRenewals({
          doctor_id: user?.doctorId || user?.id,
          status: 'pending',
          limit: 20
        });

        const renewals = renewalsResponse?.data || renewalsResponse || [];

        renewals.forEach(renewal => {
          const patientName = renewal.patient?.user?.first_name
            ? `${renewal.patient.user.first_name} ${renewal.patient.user.last_name}`
            : 'Paciente';
          const medicationName = renewal.prescription?.medications?.[0]?.name || 'medicamento';

          generatedNotifications.push({
            id: `renewal-pending-${renewal.id}`,
            type: 'prescription_renewal',
            title: 'Solicitud de renovación pendiente',
            message: `${patientName} solicita renovación de ${medicationName}${renewal.notes ? `. Nota: ${renewal.notes}` : ''}`,
            date: renewal.created_at,
            relatedId: renewal.id,
            relatedType: 'renewal'
          });
        });
      } catch (renewalError) {
        console.log('[DoctorNotifications] Could not fetch renewals:', renewalError.message);
      }

      // Fetch recent ratings for this doctor
      try {
        const ratingsResponse = await DoctorRatingModel.getByDoctor(user?.doctorId || user?.id, { limit: 15 });
        const ratings = ratingsResponse?.data || ratingsResponse || [];

        ratings.forEach(rating => {
          const ratedAt = new Date(rating.created_at);
          const ratedHoursAgo = (now - ratedAt) / (1000 * 60 * 60);
          
          if (ratedHoursAgo <= 168) { // Last 7 days
            const patientName = rating.patient?.user?.first_name
              ? `${rating.patient.user.first_name} ${rating.patient.user.last_name}`
              : rating.patient_name || 'Paciente';
            
            generatedNotifications.push({
              id: `rating-${rating.id}`,
              type: 'rating',
              title: 'Nueva calificación recibida',
              message: `${patientName} te ha calificado con ${rating.rating} estrella${rating.rating !== 1 ? 's' : ''}${rating.comment ? `. "${rating.comment}"` : ''}`,
              date: rating.created_at,
              relatedId: rating.id,
              relatedType: 'rating'
            });
          }
        });
      } catch (ratingError) {
        console.log('[DoctorNotifications] Could not fetch ratings:', ratingError.message);
      }

      // Fetch schedule exception requests status
      try {
        const exceptionsResponse = await ScheduleModel.getMyExceptionRequests();
        const exceptions = Array.isArray(exceptionsResponse) ? exceptionsResponse : exceptionsResponse?.data || [];

        exceptions.forEach(exception => {
          const exceptionDate = new Date(exception.reviewed_at || exception.created_at);
          const exceptionHoursAgo = (now - exceptionDate) / (1000 * 60 * 60);
          
          // Show approved/rejected in last 7 days, pending always
          if (exception.status === 'approved' && exceptionHoursAgo <= 168) {
            const exceptionTypeLabel = exception.exception_type === 'vacation' ? 'vacaciones' : 
                                       exception.exception_type === 'day_off' ? 'día libre' : 
                                       exception.exception_type === 'partial' ? 'horario parcial' : 'excepción';
            generatedNotifications.push({
              id: `schedule-approved-${exception.id}`,
              type: 'schedule_approved',
              title: 'Solicitud de horario aprobada',
              message: `Tu solicitud de ${exceptionTypeLabel} para el ${new Date(exception.exception_date).toLocaleDateString('es-ES')} ha sido aprobada${exception.admin_notes ? `. Nota: ${exception.admin_notes}` : ''}`,
              date: exception.reviewed_at || exception.updated_at,
              relatedId: exception.id,
              relatedType: 'schedule_exception'
            });
          } else if (exception.status === 'rejected' && exceptionHoursAgo <= 168) {
            const exceptionTypeLabel = exception.exception_type === 'vacation' ? 'vacaciones' : 
                                       exception.exception_type === 'day_off' ? 'día libre' : 
                                       exception.exception_type === 'partial' ? 'horario parcial' : 'excepción';
            generatedNotifications.push({
              id: `schedule-rejected-${exception.id}`,
              type: 'schedule_rejected',
              title: 'Solicitud de horario rechazada',
              message: `Tu solicitud de ${exceptionTypeLabel} para el ${new Date(exception.exception_date).toLocaleDateString('es-ES')} ha sido rechazada. Motivo: ${exception.admin_notes || 'No especificado'}`,
              date: exception.reviewed_at || exception.updated_at,
              relatedId: exception.id,
              relatedType: 'schedule_exception'
            });
          } else if (exception.status === 'pending') {
            const exceptionTypeLabel = exception.exception_type === 'vacation' ? 'vacaciones' : 
                                       exception.exception_type === 'day_off' ? 'día libre' : 
                                       exception.exception_type === 'partial' ? 'horario parcial' : 'excepción';
            generatedNotifications.push({
              id: `schedule-pending-${exception.id}`,
              type: 'schedule_pending',
              title: 'Solicitud pendiente de aprobación',
              message: `Tu solicitud de ${exceptionTypeLabel} para el ${new Date(exception.exception_date).toLocaleDateString('es-ES')} está pendiente de revisión por administración`,
              date: exception.created_at,
              relatedId: exception.id,
              relatedType: 'schedule_exception'
            });
          }
        });
      } catch (exceptionError) {
        console.log('[DoctorNotifications] Could not fetch schedule exceptions:', exceptionError.message);
      }

      // Fetch system/admin notifications from database
      try {
        const dbNotifications = await NotificationModel.getUserNotifications({ limit: 50 });
        
        dbNotifications.forEach(notif => {
          generatedNotifications.push({
            id: `db-${notif.id}`,
            type: notif.notification_type || 'system',
            title: notif.title,
            message: notif.message,
            date: notif.created_at,
            relatedId: notif.id,
            relatedType: 'notification',
            priority: notif.priority,
            isFromDb: true
          });
        });
      } catch (dbError) {
        console.log('[DoctorNotifications] Could not fetch system notifications:', dbError.message);
        // Continue without db notifications
      }

    } catch (err) {
      console.error('[DoctorNotifications] Error fetching data:', err);
      throw err;
    }

    // Sort by date descending and filter deleted
    return generatedNotifications
      .filter(n => !deletedNotifications.includes(n.id))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [user, deletedNotifications]);

  /**
   * Load notifications
   */
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const generated = await generateNotifications();
      setNotifications(generated);
    } catch (err) {
      console.error('[DoctorNotifications] Error:', err);
      setError('Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [generateNotifications]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  /**
   * Persist read notifications to localStorage
   */
  useEffect(() => {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(readNotifications));
  }, [readNotifications]);

  /**
   * Persist deleted notifications to localStorage
   */
  useEffect(() => {
    localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(deletedNotifications));
  }, [deletedNotifications]);

  /**
   * Show toast notification
   */
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  /**
   * Check if notification is read
   */
  const isRead = (notificationId) => readNotifications.includes(notificationId);

  /**
   * Mark notification as read
   */
  const markAsRead = (notificationId) => {
    if (!readNotifications.includes(notificationId)) {
      setReadNotifications(prev => [...prev, notificationId]);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(prev => [...new Set([...prev, ...allIds])]);
    showToast('Todas las notificaciones marcadas como leídas');
  };

  /**
   * Delete notification
   */
  const deleteNotification = (notificationId) => {
    setDeletedNotifications(prev => [...prev, notificationId]);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    showToast('Notificación eliminada');
  };

  /**
   * Get filtered notifications based on active tab
   */
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !isRead(n.id));
      case 'new_appointment':
        return notifications.filter(n => n.type === 'new_appointment' || n.type === 'appointment_today');
      case 'cancelled_appointment':
        return notifications.filter(n => n.type === 'cancelled_appointment');
      case 'prescription_renewal':
        return notifications.filter(n => n.type === 'prescription_renewal' || n.type === 'renewal_pending');
      case 'rating':
        return notifications.filter(n => n.type === 'rating');
      case 'schedule':
        return notifications.filter(n => n.type === 'schedule_approved' || n.type === 'schedule_rejected' || n.type === 'schedule_pending');
      case 'system':
        return notifications.filter(n => n.type === 'announcement' || n.type === 'system');
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !isRead(n.id)).length;
  const renewalCount = notifications.filter(n => n.type === 'prescription_renewal').length;
  const ratingCount = notifications.filter(n => n.type === 'rating').length;
  const scheduleCount = notifications.filter(n => n.type === 'schedule_approved' || n.type === 'schedule_rejected' || n.type === 'schedule_pending').length;
  const systemCount = notifications.filter(n => n.type === 'announcement' || n.type === 'system').length;

  // Store unread count in localStorage for the layout badge
  useEffect(() => {
    localStorage.setItem('doctor_unread_notifications_count', unreadCount.toString());
    // Dispatch custom event to notify layout
    window.dispatchEvent(new CustomEvent('notificationCountUpdate', { detail: { count: unreadCount } }));
  }, [unreadCount]);

  // Tabs configuration
  const tabs = [
    { id: 'all', label: 'Todas', count: notifications.length },
    { id: 'unread', label: 'Sin leer', count: unreadCount },
    { id: 'new_appointment', label: 'Citas', count: notifications.filter(n => n.type === 'new_appointment' || n.type === 'appointment_today').length },
    { id: 'cancelled_appointment', label: 'Cancelaciones', count: notifications.filter(n => n.type === 'cancelled_appointment').length },
    { id: 'prescription_renewal', label: 'Renovaciones', count: renewalCount },
    { id: 'rating', label: 'Calificaciones', count: ratingCount },
    { id: 'schedule', label: 'Horarios', count: scheduleCount },
    { id: 'system', label: 'Sistema', count: systemCount },
  ];

  return (
    <DoctorLayout>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <BellSolidIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Notificaciones</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                {unreadCount > 0 
                  ? `${unreadCount} sin leer`
                  : 'Todas leídas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifications}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Actualizar"
            >
              <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                <CheckCircleIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Marcar </span>todas
              </button>
            )}
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            toast.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {toast.type === 'success' 
              ? <CheckCircleIcon className="h-5 w-5" />
              : <ExclamationTriangleIcon className="h-5 w-5" />
            }
            {toast.message}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={loadNotifications}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Pending Renewals Alert */}
        {renewalCount > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <ArrowPathIcon className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800">
              Tienes {renewalCount} solicitud{renewalCount !== 1 ? 'es' : ''} de renovación pendiente{renewalCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 -mx-4 sm:mx-0 px-4 sm:px-0">
          <nav className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-t-lg whitespace-nowrap transition flex-shrink-0
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'}
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs ${
                    activeTab === tab.id 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600">No hay notificaciones</h3>
            <p className="text-gray-400 mt-2">
              {activeTab === 'unread' 
                ? 'Has leído todas tus notificaciones' 
                : 'No tienes notificaciones en esta categoría'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredNotifications.map(notification => {
              const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
              const IconComponent = config.icon;
              const notificationIsRead = isRead(notification.id);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  aria-label="Marcar notificación como leída"
                  className={`
                    relative flex items-start gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border cursor-pointer
                    transition-all duration-200 bg-white shadow-sm
                    ${notificationIsRead 
                      ? 'border-gray-200 hover:bg-gray-50' 
                      : 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'}
                  `}
                >
                  {/* Unread indicator */}
                  {!notificationIsRead && (
                    <div className="absolute top-3 sm:top-4 left-0 w-1 h-6 sm:h-8 bg-blue-500 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${config.bgColor}`}>
                    <IconComponent className={`h-4 w-4 sm:h-5 sm:w-5 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className={`inline-block text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${config.bgColor} ${config.iconColor} font-medium mb-1`}>
                          {config.label}
                        </span>
                        <h3 className={`font-medium text-sm sm:text-base ${notificationIsRead ? 'text-gray-600' : 'text-gray-900'}`}>
                          {notification.title}
                          {!notificationIsRead && (
                            <span className="ml-1 sm:ml-2 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full inline-block"></span>
                          )}
                        </h3>
                      </div>
                      <span className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap flex-shrink-0">
                        {getTimeAgo(notification.date)}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs sm:text-sm line-clamp-2 ${notificationIsRead ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-0.5 sm:gap-1">
                    {!notificationIsRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 sm:p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded transition"
                        title="Marcar como leída"
                      >
                        <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded transition"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {notifications.length > 0 && (
          <div className="text-center text-sm text-gray-500">
            Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
