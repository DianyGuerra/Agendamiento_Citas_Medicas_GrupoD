/**
 * useDashboardData Hook
 * Manages all dashboard data fetching and state
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  AppointmentModel, 
  MedicalRecordModel, 
  PrescriptionModel, 
  PatientModel, 
  NotificationModel, 
  BillingModel 
} from '../../../../models';
import { READ_NOTIFICATIONS_KEY } from '../../shared/constants';
import {
  CalendarIcon,
  ClockIcon,
  BeakerIcon,
  XCircleIcon,
  CheckCircleIcon,
  BellIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

/**
 * Process appointments and generate notifications
 */
function generateDashboardNotifications(appointments, renewals, labReports, billings, dbNotifications, readNotifications) {
  const now = new Date();
  const allNotifications = [];

  // Appointment notifications
  appointments.forEach(apt => {
    if (apt.status_code === 'scheduled' || apt.status_code === 'confirmed') {
      const notifId = `apt-confirmed-${apt.id}`;
      const aptDate = new Date(apt.scheduled_start);
      const hoursUntil = (aptDate - now) / (1000 * 60 * 60);
      
      if (hoursUntil > 0 && hoursUntil <= 24) {
        allNotifications.push({
          id: `apt-reminder-${apt.id}`,
          type: 'appointment_reminder',
          title: 'Recordatorio de cita',
          message: `Tu cita con Dr. ${apt.doctor_first_name || ''} ${apt.doctor_last_name || ''} es en ${Math.round(hoursUntil)} horas`,
          timestamp: now,
          isRead: readNotifications.includes(`apt-reminder-${apt.id}`),
          icon: ClockIcon,
          color: 'yellow'
        });
      }

      allNotifications.push({
        id: notifId,
        type: 'appointment_confirmed',
        title: 'Cita confirmada',
        message: `Cita con Dr. ${apt.doctor_first_name || ''} ${apt.doctor_last_name || ''} - ${apt.specialty_name || 'Especialidad'}`,
        timestamp: new Date(apt.created_at || apt.scheduled_start),
        isRead: readNotifications.includes(notifId),
        icon: CalendarIcon,
        color: 'blue'
      });
    }

    if (apt.status_code === 'cancelled') {
      const notifId = `apt-cancelled-${apt.id}`;
      allNotifications.push({
        id: notifId,
        type: 'appointment_cancelled',
        title: 'Cita cancelada',
        message: `La cita con Dr. ${apt.doctor_first_name || ''} ${apt.doctor_last_name || ''} ha sido cancelada`,
        timestamp: new Date(apt.updated_at || apt.created_at),
        isRead: readNotifications.includes(notifId),
        icon: XCircleIcon,
        color: 'red'
      });
    }
  });

  // Renewal notifications
  renewals.forEach(r => {
    if (r.status === 'approved') {
      const notifId = `renewal-approved-${r.id}`;
      allNotifications.push({
        id: notifId,
        type: 'renewal_approved',
        title: 'Renovación aprobada',
        message: r.prescription_medication ? `Tu solicitud de ${r.prescription_medication} fue aprobada` : 'Tu solicitud de renovación fue aprobada',
        timestamp: new Date(r.reviewed_at || r.updated_at || r.created_at),
        isRead: readNotifications.includes(notifId),
        icon: CheckCircleIcon,
        color: 'green'
      });
    } else if (r.status === 'rejected') {
      const notifId = `renewal-rejected-${r.id}`;
      allNotifications.push({
        id: notifId,
        type: 'renewal_rejected',
        title: 'Renovación rechazada',
        message: r.prescription_medication ? `Tu solicitud de ${r.prescription_medication} fue rechazada` : 'Tu solicitud de renovación fue rechazada',
        timestamp: new Date(r.reviewed_at || r.updated_at || r.created_at),
        isRead: readNotifications.includes(notifId),
        icon: XCircleIcon,
        color: 'red'
      });
    }
  });

  // Lab results notifications
  labReports.forEach(report => {
    if (report.status === 'completed') {
      const notifId = `lab-ready-${report.id}`;
      allNotifications.push({
        id: notifId,
        type: 'lab_results_ready',
        title: 'Resultados disponibles',
        message: `Los resultados de ${report.test_type || report.report_type || 'laboratorio'} están listos`,
        timestamp: new Date(report.updated_at || report.created_at),
        isRead: readNotifications.includes(notifId),
        icon: BeakerIcon,
        color: 'purple'
      });
    }
  });

  // Billing notifications
  billings.forEach(billing => {
    if (billing.status === 'pending') {
      const notifId = `billing-new-${billing.id}`;
      allNotifications.push({
        id: notifId,
        type: 'billing_new',
        title: 'Nueva factura',
        message: `Tienes una factura pendiente de $${billing.total_amount?.toFixed(2) || '0.00'}`,
        timestamp: new Date(billing.created_at),
        isRead: readNotifications.includes(notifId),
        icon: CurrencyDollarIcon,
        color: 'orange'
      });
    }
  });

  // Database notifications
  dbNotifications.forEach(n => {
    const notifId = `db-${n.id}`;
    allNotifications.push({
      id: notifId,
      type: n.type || 'system',
      title: n.title,
      message: n.message,
      timestamp: new Date(n.created_at),
      isRead: readNotifications.includes(notifId) || n.is_read,
      icon: BellIcon,
      color: 'gray'
    });
  });

  return allNotifications
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .filter(n => !n.isRead)
    .slice(0, 5);
}

export default function useDashboardData() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingResults: 0,
    activePrescriptions: 0,
  });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [
        appointmentsRes, 
        prescriptionsRes, 
        labReportsRes, 
        consultationNotesRes, 
        profileRes, 
        renewalsRes, 
        billingsRes, 
        dbNotificationsRes
      ] = await Promise.allSettled([
        AppointmentModel.getPatientAppointments(),
        PrescriptionModel.getPatientPrescriptions(),
        MedicalRecordModel.getLabReports(),
        MedicalRecordModel.getConsultationNotes(),
        PatientModel.getProfile(),
        PrescriptionModel.getRenewals({ limit: 10 }),
        BillingModel.getAll({ limit: 20 }),
        NotificationModel.getUserNotifications({ limit: 10 })
      ]);

      const now = new Date();
      
      // Process appointments
      const appointments = appointmentsRes.status === 'fulfilled' 
        ? (appointmentsRes.value.data || appointmentsRes.value || [])
        : [];

      const upcoming = appointments
        .filter(apt => new Date(apt.scheduled_start) >= now && apt.status_code !== 'cancelled')
        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));

      const completed = appointments.filter(apt => apt.status_code === 'completed');

      // Process prescriptions
      const prescriptions = prescriptionsRes.status === 'fulfilled'
        ? (prescriptionsRes.value.data || prescriptionsRes.value || [])
        : [];

      // Process lab reports
      const labReports = labReportsRes.status === 'fulfilled'
        ? (labReportsRes.value.data || labReportsRes.value || [])
        : [];
      const pendingResults = labReports.filter(
        report => report.status === 'pending' || report.status === 'processing'
      ).length;

      // Process consultation notes for recent history
      const consultationNotes = consultationNotesRes.status === 'fulfilled'
        ? (consultationNotesRes.value.data || consultationNotesRes.value || [])
        : [];
      
      const recentConsultations = consultationNotes
        .filter(note => note.diagnosis || note.notes)
        .slice(0, 3)
        .map(note => ({
          date: note.scheduled_start || note.created_at,
          diagnosis: note.diagnosis || 'Consulta General',
          doctor: {
            first_name: note.doctor_first_name,
            last_name: note.doctor_last_name
          },
          specialty: {
            name: note.specialty_name
          }
        }));
      
      setRecentHistory(recentConsultations);

      // Process patient profile for health summary
      const profile = profileRes.status === 'fulfilled'
        ? (profileRes.value.data || profileRes.value || null)
        : null;

      const lastCompletedAppointment = completed
        .sort((a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start))[0];
      
      const lastVisitDate = lastCompletedAppointment
        ? new Date(lastCompletedAppointment.scheduled_start).toLocaleDateString('es-EC', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : null;

      setHealthSummary({
        blood_type: profile?.blood_type || null,
        allergies: profile?.allergies || null,
        conditions: profile?.medical_conditions || null,
        medications: profile?.current_medications || null,
        lastVisit: lastVisitDate
      });

      setStats({
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        pendingResults: pendingResults,
        activePrescriptions: prescriptions.length,
      });

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0]);
      }

      // Generate notifications
      const readNotifications = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
      const renewals = renewalsRes.status === 'fulfilled' ? (renewalsRes.value?.data || renewalsRes.value || []) : [];
      const billings = billingsRes.status === 'fulfilled' ? (billingsRes.value?.data || billingsRes.value || []) : [];
      const dbNotifications = dbNotificationsRes.status === 'fulfilled' ? (dbNotificationsRes.value || []) : [];

      const notifications = generateDashboardNotifications(
        appointments, 
        renewals, 
        labReports, 
        billings, 
        dbNotifications, 
        readNotifications
      );
      setRecentNotifications(notifications);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return {
    loading,
    stats,
    nextAppointment,
    recentHistory,
    healthSummary,
    recentNotifications,
    refresh: loadDashboardData,
  };
}
