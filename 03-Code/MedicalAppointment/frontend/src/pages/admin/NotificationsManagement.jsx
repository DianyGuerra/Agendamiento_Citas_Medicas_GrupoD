import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { externalApi, crudApi } from '../../services/httpClient';
import {
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  EnvelopeIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function NotificationsManagement() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    subject: '',
    message: '',
    target: 'all', // all, patients, doctors
    sendEmail: false, // Optional email sending
  });

  useEffect(() => {
    loadReminders();
  }, [statusFilter]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      // Get pending reminders count and due appointments for reminders
      const [pendingRes, dueRes] = await Promise.all([
        externalApi.get('/reminders/pending/count').catch(() => ({ data: { data: { pendingCount: 0 } } })),
        externalApi.get('/reminders/due/24').catch(() => ({ data: { data: { appointments: [] } } }))
      ]);
      
      // Extract appointments from the response
      const dueAppointments = dueRes.data?.data?.appointments || dueRes.data?.appointments || [];
      
      // Transform appointments to display format
      const remindersList = dueAppointments.map(apt => ({
        id: apt.id,
        appointment_id: apt.id,
        reminder_type: 'email',
        scheduled_send_time: apt.scheduled_start,
        send_status: 'pending', // These are appointments that need reminders
        sent_at: null,
        patient: apt.patient || {
          first_name: apt.patient?.first_name || '',
          last_name: apt.patient?.last_name || '',
          email: apt.patient?.email || ''
        },
        doctor: apt.doctors?.users ? 
          `${apt.doctors.users.first_name || ''} ${apt.doctors.users.last_name || ''}`.trim() :
          'Doctor',
        specialty: apt.doctors?.specialties?.name || 'Medicina General',
        room: apt.consultation_rooms?.name || ''
      }));
      setReminders(remindersList);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const retryReminder = async (appointmentId) => {
    try {
      // Create a new reminder for this appointment
      await externalApi.post('/reminders/create', { appointment_id: appointmentId });
      showNotificationMessage('Recordatorio reenviado', 'success');
      loadReminders();
    } catch (error) {
      console.error('Error retrying reminder:', error);
      showNotificationMessage('Error al reenviar', 'error');
    }
  };

  const cancelReminder = async (appointmentId) => {
    try {
      await externalApi.delete(`/reminders/appointment/${appointmentId}`);
      showNotificationMessage('Recordatorio cancelado', 'success');
      loadReminders();
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      showNotificationMessage('Error al cancelar', 'error');
    }
  };

  const sendAnnouncement = async () => {
    try {
      // Use the custom notification endpoint - saves to DB and optionally sends email
      const response = await externalApi.post('/notifications/custom', {
        target: announcementForm.target, // 'all', 'patients', or 'doctors'
        subject: announcementForm.subject,
        message: announcementForm.message,
        type: 'announcement',
        sendEmail: announcementForm.sendEmail // Optional email sending
      });
      
      const result = response.data?.data || response.data || {};
      let successMsg = 'Anuncio publicado';
      if (announcementForm.sendEmail && result.emailsSentCount > 0) {
        successMsg += ` y ${result.emailsSentCount} correo(s) enviado(s)`;
      } else if (announcementForm.sendEmail && result.emailsSentCount === 0) {
        successMsg += ' (no se encontraron usuarios para enviar correo)';
      }
      
      showNotificationMessage(successMsg, 'success');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        subject: '',
        message: '',
        target: 'all',
        sendEmail: false,
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      showNotificationMessage(error.message || 'Error al enviar anuncio', 'error');
    }
  };

  const showNotificationMessage = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Enviado' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fallido' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getReminderTypeIcon = () => {
    return <EnvelopeIcon className="w-4 h-4" />;
  };

  const filteredReminders = reminders.filter(reminder => {
    const search = searchTerm.toLowerCase();
    const patientName = `${reminder.patient?.first_name || ''} ${reminder.patient?.last_name || ''}`.toLowerCase();
    return patientName.includes(search);
  });

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.send_status === 'pending').length,
    sent: reminders.filter(r => r.send_status === 'sent').length,
    failed: reminders.filter(r => r.send_status === 'failed').length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Notificaciones y Recordatorios</h2>
            <p className="text-sm sm:text-base text-gray-600">Gestión de recordatorios de citas y anuncios del sistema</p>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={loadReminders}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowPathIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Enviar Anuncio</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
                <BellIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Total</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-yellow-100 rounded-full">
                <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Pendientes</p>
                <p className="text-lg sm:text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Enviados</p>
                <p className="text-lg sm:text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-red-100 rounded-full">
                <ExclamationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-500 truncate">Fallidos</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Filtros:</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar paciente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                style={{ fontSize: '16px' }}
              >
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="sent">Enviados</option>
                <option value="failed">Fallidos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reminders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron recordatorios</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200">
                {filteredReminders.map((reminder) => (
                  <div key={reminder.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 truncate">
                          {reminder.patient?.first_name} {reminder.patient?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{reminder.patient?.email}</p>
                      </div>
                      {getStatusBadge(reminder.send_status)}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Cita</p>
                        <p className="text-gray-700">#{reminder.appointment_id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Programado</p>
                        <p className="text-gray-700 text-xs">{formatDate(reminder.scheduled_send_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                      {reminder.send_status === 'failed' && (
                        <button
                          onClick={() => retryReminder(reminder.id)}
                          className="flex-1 flex items-center justify-center gap-1 p-2 text-green-600 hover:bg-green-50 rounded bg-gray-50"
                        >
                          <ArrowPathIcon className="w-4 h-4" />
                          <span className="text-xs">Reintentar</span>
                        </button>
                      )}
                      {reminder.send_status === 'pending' && (
                        <button
                          onClick={() => cancelReminder(reminder.id)}
                          className="flex-1 flex items-center justify-center gap-1 p-2 text-red-600 hover:bg-red-50 rounded bg-gray-50"
                        >
                          <XCircleIcon className="w-4 h-4" />
                          <span className="text-xs">Cancelar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cita</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReminders.map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-gray-100 rounded">
                            {getReminderTypeIcon()}
                          </span>
                          <span className="text-sm text-gray-700 capitalize">
                            Email
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {reminder.patient?.first_name} {reminder.patient?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reminder.patient?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          #{reminder.appointment_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(reminder.scheduled_send_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reminder.sent_at ? formatDate(reminder.sent_at) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(reminder.send_status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {reminder.send_status === 'failed' && (
                            <button
                              onClick={() => retryReminder(reminder.id)}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                              title="Reintentar"
                            >
                              <ArrowPathIcon className="w-5 h-5" />
                            </button>
                          )}
                          {reminder.send_status === 'pending' && (
                            <button
                              onClick={() => cancelReminder(reminder.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Cancelar"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Enviar Anuncio del Sistema</h3>
                <p className="text-xs sm:text-sm text-gray-500">Envía una notificación masiva a usuarios</p>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <input
                    type="text"
                    value={announcementForm.subject}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="Asunto del correo"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="Contenido del mensaje..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={announcementForm.target}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Todos los usuarios</option>
                    <option value="patients">Solo pacientes</option>
                    <option value="doctors">Solo doctores</option>
                  </select>
                </div>

                {/* Optional email sending */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={announcementForm.sendEmail}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="sendEmail" className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                    También enviar por correo electrónico
                  </label>
                </div>

                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <BellIcon className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-blue-700">
                    El anuncio aparecerá en las notificaciones de {announcementForm.target === 'all' ? 'todos los usuarios' : announcementForm.target === 'patients' ? 'pacientes' : 'doctores'}
                  </span>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendAnnouncement}
                  disabled={!announcementForm.subject || !announcementForm.message}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Enviar Anuncio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
