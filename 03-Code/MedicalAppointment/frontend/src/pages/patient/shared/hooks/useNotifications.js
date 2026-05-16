/**
 * useNotifications Hook
 * Shared logic for generating notifications from various sources
 * Used by PatientNotifications page and PatientLayout for unread count
 */
import { useState, useCallback } from 'react';
import { 
  AppointmentModel, 
  PrescriptionModel, 
  MedicalRecordModel, 
  BillingModel, 
  NotificationModel 
} from '../../../../models';
import { READ_NOTIFICATIONS_KEY, DELETED_NOTIFICATIONS_KEY } from '../constants';

/**
 * Get time ago string from date
 */
export function getTimeAgo(date) {
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
 * Generate notifications from all sources
 */
export async function generateNotifications(userId) {
  const generatedNotifications = [];
  const now = new Date();

  try {
    // Fetch appointments
    const appointmentsResponse = await AppointmentModel.getPatientAppointments({ limit: 50 });
    const appointments = appointmentsResponse?.data || appointmentsResponse || [];

    appointments.forEach(apt => {
      const doctorName = apt.doctor_first_name 
        ? `Dr. ${apt.doctor_first_name} ${apt.doctor_last_name || ''}`
        : 'Tu médico';
      const specialty = apt.specialty_name || '';
      const dateStr = new Date(apt.scheduled_start).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      });
      const status = apt.status_code || apt.status;

      // Confirmed appointments
      if (status === 'scheduled' || status === 'confirmed') {
        generatedNotifications.push({
          id: `apt-confirmed-${apt.id}`,
          type: 'appointment_confirmed',
          title: 'Cita Confirmada',
          message: `Tu cita con ${doctorName}${specialty ? ` (${specialty})` : ''} ha sido confirmada para el ${dateStr}`,
          date: apt.created_at,
          relatedId: apt.id,
          relatedType: 'appointment'
        });

        // Upcoming reminder
        const aptDate = new Date(apt.scheduled_start);
        const hoursUntil = (aptDate - now) / (1000 * 60 * 60);
        if (hoursUntil > 0 && hoursUntil <= 48) {
          generatedNotifications.push({
            id: `apt-reminder-${apt.id}`,
            type: 'appointment_reminder',
            title: 'Recordatorio de Cita',
            message: `Tienes una cita con ${doctorName} ${hoursUntil <= 24 ? 'mañana' : 'pronto'} - ${dateStr}`,
            date: new Date().toISOString(),
            relatedId: apt.id,
            relatedType: 'appointment'
          });
        }
      }

      // Completed appointments
      if (status === 'completed') {
        generatedNotifications.push({
          id: `apt-completed-${apt.id}`,
          type: 'prescription_ready',
          title: 'Consulta Completada',
          message: `Tu consulta con ${doctorName} ha sido completada.`,
          date: apt.updated_at || apt.scheduled_end,
          relatedId: apt.id,
          relatedType: 'appointment'
        });
      }

      // Cancelled appointments
      if (status === 'cancelled') {
        generatedNotifications.push({
          id: `apt-cancelled-${apt.id}`,
          type: 'appointment_cancelled',
          title: 'Cita Cancelada',
          message: `La cita con ${doctorName} para el ${dateStr} ha sido cancelada.`,
          date: apt.updated_at || apt.created_at,
          relatedId: apt.id,
          relatedType: 'appointment'
        });
      }
    });
  } catch (e) {
    console.log('[useNotifications] Could not fetch appointments:', e.message);
  }

  // Fetch renewals
  try {
    const renewalsResponse = await PrescriptionModel.getRenewals({ patient_id: userId, limit: 20 });
    const renewals = renewalsResponse?.data || renewalsResponse || [];

    renewals.forEach(renewal => {
      const medicationName = renewal.prescription?.medications?.[0]?.name || 'tu medicamento';
      const reviewDate = new Date(renewal.reviewed_at || renewal.updated_at || renewal.created_at);
      const hoursAgo = (now - reviewDate) / (1000 * 60 * 60);

      if (renewal.status === 'approved' && hoursAgo <= 168) {
        generatedNotifications.push({
          id: `renewal-approved-${renewal.id}`,
          type: 'renewal_approved',
          title: 'Renovación Aprobada',
          message: `Tu solicitud de renovación para ${medicationName} ha sido aprobada.`,
          date: renewal.reviewed_at || renewal.updated_at,
          relatedId: renewal.id,
          relatedType: 'renewal'
        });
      } else if (renewal.status === 'rejected' && hoursAgo <= 168) {
        generatedNotifications.push({
          id: `renewal-rejected-${renewal.id}`,
          type: 'renewal_rejected',
          title: 'Renovación Rechazada',
          message: `Tu solicitud de renovación para ${medicationName} ha sido rechazada.`,
          date: renewal.reviewed_at || renewal.updated_at,
          relatedId: renewal.id,
          relatedType: 'renewal'
        });
      } else if (renewal.status === 'pending') {
        generatedNotifications.push({
          id: `renewal-pending-${renewal.id}`,
          type: 'renewal_pending',
          title: 'Renovación Pendiente',
          message: `Tu solicitud de renovación para ${medicationName} está pendiente.`,
          date: renewal.created_at,
          relatedId: renewal.id,
          relatedType: 'renewal'
        });
      }
    });
  } catch (e) {
    console.log('[useNotifications] Could not fetch renewals:', e.message);
  }

  // Fetch lab results
  try {
    const labReportsResponse = await MedicalRecordModel.getLabReports();
    const labReports = labReportsResponse?.data || labReportsResponse || [];

    labReports.forEach(report => {
      const reportDate = new Date(report.created_at);
      const hoursAgo = (now - reportDate) / (1000 * 60 * 60);

      if (report.status === 'completed' && hoursAgo <= 168) {
        generatedNotifications.push({
          id: `lab-ready-${report.id}`,
          type: 'lab_results_ready',
          title: 'Resultados de Laboratorio Listos',
          message: `Los resultados de "${report.test_name}" ya están disponibles.`,
          date: report.created_at,
          relatedId: report.id,
          relatedType: 'lab_report'
        });
      }

      if ((report.status === 'pending' || report.status === 'processing') && hoursAgo <= 72) {
        generatedNotifications.push({
          id: `lab-ordered-${report.id}`,
          type: 'lab_ordered',
          title: 'Examen de Laboratorio Ordenado',
          message: `Se ha ordenado el examen "${report.test_name}".`,
          date: report.created_at,
          relatedId: report.id,
          relatedType: 'lab_report'
        });
      }
    });
  } catch (e) {
    console.log('[useNotifications] Could not fetch lab reports:', e.message);
  }

  // Fetch billings
  try {
    const billingsResponse = await BillingModel.getAll({ limit: 20 });
    const billings = billingsResponse?.data || billingsResponse || [];

    billings.forEach(billing => {
      const billingDate = new Date(billing.created_at);
      const hoursAgo = (now - billingDate) / (1000 * 60 * 60);

      if (billing.status === 'pending' && hoursAgo <= 168) {
        generatedNotifications.push({
          id: `billing-new-${billing.id}`,
          type: 'billing_new',
          title: 'Nueva Factura Generada',
          message: `Tienes una nueva factura por $${Number.parseFloat(billing.total_amount).toFixed(2)}.`,
          date: billing.created_at,
          relatedId: billing.id,
          relatedType: 'billing'
        });
      }

      if (billing.status === 'paid' && billing.payment_date) {
        const paidDate = new Date(billing.payment_date);
        const paidHoursAgo = (now - paidDate) / (1000 * 60 * 60);
        if (paidHoursAgo <= 72) {
          generatedNotifications.push({
            id: `billing-paid-${billing.id}`,
            type: 'billing_paid',
            title: 'Pago Confirmado',
            message: `Tu pago de $${Number.parseFloat(billing.total_amount).toFixed(2)} ha sido confirmado.`,
            date: billing.payment_date,
            relatedId: billing.id,
            relatedType: 'billing'
          });
        }
      }

      if (billing.status === 'pending' && billing.due_date) {
        const dueDate = new Date(billing.due_date);
        if (now > dueDate) {
          generatedNotifications.push({
            id: `billing-overdue-${billing.id}`,
            type: 'billing_overdue',
            title: 'Factura Vencida',
            message: `La factura por $${Number.parseFloat(billing.total_amount).toFixed(2)} está vencida.`,
            date: billing.due_date,
            relatedId: billing.id,
            relatedType: 'billing'
          });
        }
      }
    });
  } catch (e) {
    console.log('[useNotifications] Could not fetch billings:', e.message);
  }

  // Fetch system notifications
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
        isFromDb: true
      });
    });
  } catch (e) {
    console.log('[useNotifications] Could not fetch system notifications:', e.message);
  }

  return generatedNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Calculate unread count from notifications
 */
export function calculateUnreadCount(notifications, readNotifications) {
  return notifications.filter(n => !readNotifications.includes(n.id)).length;
}

/**
 * Custom hook for managing notifications
 */
export default function useNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [readNotifications, setReadNotifications] = useState(() => {
    const saved = localStorage.getItem(READ_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedNotifications, setDeletedNotifications] = useState(() => {
    const saved = localStorage.getItem(DELETED_NOTIFICATIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const generated = await generateNotifications(userId);
      const filtered = generated.filter(n => !deletedNotifications.includes(n.id));
      setNotifications(filtered);
    } catch (err) {
      console.error('[useNotifications] Error:', err);
      setError('Error al cargar notificaciones');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [userId, deletedNotifications]);

  const markAsRead = useCallback((notificationId) => {
    setReadNotifications(prev => {
      if (prev.includes(notificationId)) return prev;
      const updated = [...prev, notificationId];
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(prev => {
      const updated = [...new Set([...prev, ...allIds])];
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [notifications]);

  const deleteNotification = useCallback((notificationId) => {
    setDeletedNotifications(prev => {
      const updated = [...prev, notificationId];
      localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(updated));
      return updated;
    });
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const isRead = useCallback((notificationId) => {
    return readNotifications.includes(notificationId);
  }, [readNotifications]);

  const unreadCount = calculateUnreadCount(notifications, readNotifications);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isRead,
  };
}
