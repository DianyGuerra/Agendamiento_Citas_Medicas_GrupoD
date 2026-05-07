/**
 * Patient Module - Shared Constants
 * Central location for all shared constants used across patient pages
 */

// LocalStorage Keys
export const READ_NOTIFICATIONS_KEY = 'patient_read_notifications';
export const DELETED_NOTIFICATIONS_KEY = 'patient_deleted_notifications';

// Status Configuration for Appointments
export const APPOINTMENT_STATUS = {
  scheduled: { label: 'Programada', color: 'bg-blue-500 text-white' },
  confirmed: { label: 'Confirmada', color: 'bg-green-500 text-white' },
  completed: { label: 'Completada', color: 'bg-emerald-600 text-white' },
  cancelled: { label: 'Cancelada', color: 'bg-red-500 text-white' },
  pending: { label: 'Pendiente', color: 'bg-yellow-500 text-white' },
  no_show: { label: 'No asistió', color: 'bg-orange-500 text-white' },
};

// Status Configuration for Prescriptions
export const PRESCRIPTION_STATUS = {
  active: { label: 'Activa', color: 'bg-green-100 border-green-300 text-green-800' },
  expiring: { label: 'Por Vencer', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  expired: { label: 'Vencida', color: 'bg-red-100 border-red-300 text-red-800' },
};

// Status Configuration for Renewal Requests
export const RENEWAL_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 border-yellow-300 text-yellow-800' },
  approved: { label: 'Aprobada', color: 'bg-green-100 border-green-300 text-green-800' },
  rejected: { label: 'Rechazada', color: 'bg-red-100 border-red-300 text-red-800' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 border-gray-300 text-gray-800' },
};

// Status Configuration for Lab Results
export const LAB_STATUS = {
  completed: { label: 'Normal', color: 'bg-green-100 text-green-800' },
  needs_review: { label: 'Revisar', color: 'bg-yellow-100 text-yellow-800' },
  pending: { label: 'Pendiente', color: 'bg-blue-100 text-blue-800' },
};

// Lab Parameter Status
export const PARAMETER_STATUS = {
  alto: 'text-red-700 bg-red-50 font-bold',
  high: 'text-red-700 bg-red-50 font-bold',
  bajo: 'text-yellow-700 bg-yellow-50 font-bold',
  low: 'text-yellow-700 bg-yellow-50 font-bold',
  normal: 'text-green-700 bg-green-50 font-bold',
  default: 'text-gray-700 bg-gray-50',
};

// Billing Status Configuration
export const BILLING_STATUS = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800 border-green-200' },
};

// Payment Methods
export const PAYMENT_METHODS = {
  cash: 'Efectivo',
  card: 'Tarjeta de Crédito/Débito',
  transfer: 'Transferencia Bancaria',
  insurance: 'Seguro Médico',
};

// Blood Types
export const BLOOD_TYPES = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];

// Gender Options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Masculino' },
  { value: 'female', label: 'Femenino' },
  { value: 'other', label: 'Otro' },
];

// Notification Types Configuration
export const NOTIFICATION_TYPES = {
  appointment_confirmed: {
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Cita Confirmada',
  },
  appointment_reminder: {
    bgColor: 'bg-blue-100',
    iconColor: 'text-blue-600',
    label: 'Recordatorio',
  },
  appointment_cancelled: {
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Cita Cancelada',
  },
  appointment_rescheduled: {
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    label: 'Cita Reprogramada',
  },
  prescription_ready: {
    bgColor: 'bg-purple-100',
    iconColor: 'text-purple-600',
    label: 'Receta Lista',
  },
  renewal_approved: {
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Renovación Aprobada',
  },
  renewal_rejected: {
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Renovación Rechazada',
  },
  renewal_pending: {
    bgColor: 'bg-amber-100',
    iconColor: 'text-amber-600',
    label: 'Renovación Pendiente',
  },
  lab_results_ready: {
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600',
    label: 'Resultados de Lab',
  },
  lab_ordered: {
    bgColor: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    label: 'Examen Ordenado',
  },
  billing_new: {
    bgColor: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    label: 'Nueva Factura',
  },
  billing_paid: {
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600',
    label: 'Pago Confirmado',
  },
  billing_overdue: {
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600',
    label: 'Factura Vencida',
  },
  announcement: {
    bgColor: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    label: 'Anuncio',
  },
  system: {
    bgColor: 'bg-gray-100',
    iconColor: 'text-gray-600',
    label: 'Sistema',
  },
};

// Profile Tabs
export const PROFILE_TABS = [
  { id: 'personal', name: 'Información Personal' },
  { id: 'contact', name: 'Contacto' },
  { id: 'medical', name: 'Información Médica' },
  { id: 'emergency', name: 'Contacto de Emergencia' },
  { id: 'security', name: 'Seguridad' },
];

// PDF Colors (for jsPDF generation)
export const PDF_COLORS = {
  primary: [41, 128, 185],
  secondary: [52, 73, 94],
  accent: [46, 204, 113],
  warning: [241, 196, 15],
  danger: [231, 76, 60],
};

// Clinic Info for PDFs
export const CLINIC_INFO = {
  name: 'CLÍNICA SAN MIGUEL',
  subtitle: 'Centro Médico Especializado',
  phone: '(02) 2XXX-XXXX',
  email: 'info@clinicasanmiguel.ec',
};
