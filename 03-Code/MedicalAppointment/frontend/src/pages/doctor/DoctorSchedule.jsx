import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DoctorModel } from '../../models';

const DAYS = [
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
  { id: 0, name: 'Domingo', short: 'Dom' },
];

const EXCEPTION_TYPES = [
  { id: 'vacation', label: 'Vacaciones', icon: '🏖️', color: 'blue' },
  { id: 'day_off', label: 'Día libre', icon: '🏠', color: 'gray' },
  { id: 'extra_hours', label: 'Horas extra', icon: '⏰', color: 'green' },
  { id: 'holiday_work', label: 'Trabajar feriado', icon: '🎉', color: 'purple' },
  { id: 'schedule_change', label: 'Cambio de horario', icon: '📅', color: 'orange' },
];

export default function DoctorSchedule() {
  const [schedule, setSchedule] = useState({});
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    exception_type: 'vacation',
    exception_date: '',
    end_date: '', // For vacation range
    is_all_day: true,
    exception_start_time: '09:00',
    exception_end_time: '17:00',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [scheduleRes, exceptionsRes] = await Promise.all([
        DoctorModel.getMySchedule(),
        DoctorModel.getMyExceptionRequests()
      ]);
      
      // Convert schedule array to object by day_of_week
      const scheduleObj = {};
      if (scheduleRes.data && Array.isArray(scheduleRes.data)) {
        scheduleRes.data.forEach(s => {
          scheduleObj[s.day_of_week] = s;
        });
      }
      setSchedule(scheduleObj);
      setExceptions(exceptionsRes.data || []);
    } catch (err) {
      console.error('Error loading data:', err);
      showNotification('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    const labels = {
      pending: 'Pendiente',
      approved: 'Aprobada',
      rejected: 'Rechazada'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getExceptionTypeInfo = (type) => {
    return EXCEPTION_TYPES.find(t => t.id === type) || { label: type, icon: '📋', color: 'gray' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '-';
    return timeStr.substring(0, 5);
  };

  const handleRequestSubmit = async (e) => {
  e.preventDefault();
  
  if (!requestForm.exception_date) {
    showNotification('Debe seleccionar una fecha', 'error');
    return;
  }

  try {
    setSubmitting(true);
    
    if (requestForm.exception_type === 'vacation' && requestForm.end_date) {
      const start = new Date(requestForm.exception_date);
      const end = new Date(requestForm.end_date);
      
      if (end < start) {
        showNotification('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
        setSubmitting(false);
        return;
      }

      // Calculamos el número de días para el bucle for
      const diffInMs = end.getTime() - start.getTime();
      const totalDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      // creamos todas las promesas para enviarlas en paralelo 
      const requests = [];
      for (let i = 0; i <= totalDays; i++) {
        const tempDate = new Date(start);
        tempDate.setDate(start.getDate() + i);
        
        requests.push(
          DoctorModel.requestException({
            exception_type: 'vacation',
            exception_date: tempDate.toISOString().split('T')[0],
            is_all_day: true,
            reason: requestForm.reason
          })
        );
      }
      // Ejecutamos todas las peticiones al mismo tiempo
      await Promise.all(requests);

    } else {
      // Petición única para otros tipos o un solo día
      await DoctorModel.requestException({
        exception_type: requestForm.exception_type,
        exception_date: requestForm.exception_date,
        is_all_day: requestForm.is_all_day,
        exception_start_time: requestForm.is_all_day ? null : requestForm.exception_start_time,
        exception_end_time: requestForm.is_all_day ? null : requestForm.exception_end_time,
        reason: requestForm.reason
      });
    }

      showNotification('Solicitud enviada correctamente', 'success');
      setShowRequestModal(false);
      setRequestForm({
        exception_type: 'vacation',
        exception_date: '',
        end_date: '',
        is_all_day: true,
        exception_start_time: '09:00',
        exception_end_time: '17:00',
        reason: ''
      });
      loadData();
    } catch (err) {
      console.error('Error submitting request:', err);
      showNotification(err.response?.data?.message || 'Error al enviar solicitud', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('¿Está seguro de cancelar esta solicitud?')) return;
    
    try {
      await DoctorModel.cancelExceptionRequest(requestId);
      showNotification('Solicitud cancelada', 'success');
      loadData();
    } catch (err) {
      console.error('Error canceling request:', err);
      showNotification(err.response?.data?.message || 'Error al cancelar', 'error');
    }
  };

  // Separate exceptions by status
  const pendingExceptions = exceptions.filter(e => e.status === 'pending');
  const approvedExceptions = exceptions.filter(e => e.status === 'approved');
  const rejectedExceptions = exceptions.filter(e => e.status === 'rejected');

  return (
    <DoctorLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Horario</h1>
            <p className="text-gray-600 text-sm">
              Visualiza tu horario y solicita cambios
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>📝</span>
            Nueva Solicitud
          </button>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Weekly Schedule (Read Only) */}
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg sm:text-xl">📅</span>
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Horario Semanal</h2>
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">(Por Administración)</span>
              </div>
              
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2 sm:gap-3">
                {DAYS.map(day => {
                  const daySchedule = schedule[day.id];
                  const isWorking = daySchedule && daySchedule.is_working_day !== false && daySchedule.start_time;
                  
                  return (
                    <div
                      key={day.id}
                      className={`p-3 sm:p-4 rounded-lg border-2 ${
                        isWorking
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <h4 className="font-semibold text-gray-800 text-center text-sm sm:text-base">{day.short}</h4>
                      {isWorking ? (
                        <div className="text-center mt-2">
                          <p className="text-xs sm:text-sm font-medium text-green-700">
                            {formatTime(daySchedule.start_time)} - {formatTime(daySchedule.end_time)}
                          </p>
                          {daySchedule.break_start_time && (
                            <p className="text-[10px] sm:text-xs text-gray-500 mt-1 hidden sm:block">
                              Desc: {formatTime(daySchedule.break_start_time)} - {formatTime(daySchedule.break_end_time)}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">Libre</p>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <p className="text-sm text-gray-500 mt-4 text-center">
                Para cambios permanentes en su horario base, contacte a Administración
              </p>
            </div>

            {/* Pending Requests */}
            {pendingExceptions.length > 0 && (
              <div className="bg-yellow-50 rounded-lg shadow-md p-6 border border-yellow-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">⏳</span>
                  <h2 className="text-lg font-semibold text-yellow-800">
                    Solicitudes Pendientes ({pendingExceptions.length})
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {pendingExceptions.map(exc => {
                    const typeInfo = getExceptionTypeInfo(exc.exception_type);
                    return (
                      <div key={exc.id} className="bg-white p-4 rounded-lg border border-yellow-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{typeInfo.icon}</span>
                          <div>
                            <p className="font-medium text-gray-800">{typeInfo.label}</p>
                            <p className="text-sm text-gray-600">
                              {formatDate(exc.exception_date)}
                              {!exc.is_all_day && ` • ${formatTime(exc.exception_start_time)} - ${formatTime(exc.exception_end_time)}`}
                            </p>
                            {exc.reason && <p className="text-xs text-gray-500 mt-1">{exc.reason}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(exc.status)}
                          <button
                            onClick={() => handleCancelRequest(exc.id)}
                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Approved Exceptions */}
            {approvedExceptions.length > 0 && (
              <div className="bg-green-50 rounded-lg shadow-md p-6 border border-green-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">✅</span>
                  <h2 className="text-lg font-semibold text-green-800">
                    Excepciones Aprobadas ({approvedExceptions.length})
                  </h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {approvedExceptions.slice(0, 6).map(exc => {
                    const typeInfo = getExceptionTypeInfo(exc.exception_type);
                    return (
                      <div key={exc.id} className="bg-white p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{typeInfo.icon}</span>
                          <span className="font-medium text-gray-800">{typeInfo.label}</span>
                        </div>
                        <p className="text-sm text-gray-600">{formatDate(exc.exception_date)}</p>
                        {!exc.is_all_day && (
                          <p className="text-xs text-gray-500">
                            {formatTime(exc.exception_start_time)} - {formatTime(exc.exception_end_time)}
                          </p>
                        )}
                        {exc.admin_notes && (
                          <p className="text-xs text-green-600 mt-2">
                            Admin: {exc.admin_notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
                {approvedExceptions.length > 6 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Y {approvedExceptions.length - 6} más...
                  </p>
                )}
              </div>
            )}

            {/* Rejected Exceptions */}
            {rejectedExceptions.length > 0 && (
              <div className="bg-red-50 rounded-lg shadow-md p-6 border border-red-200">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">❌</span>
                  <h2 className="text-lg font-semibold text-red-800">
                    Solicitudes Rechazadas ({rejectedExceptions.length})
                  </h2>
                </div>
                
                <div className="space-y-3">
                  {rejectedExceptions.slice(0, 3).map(exc => {
                    const typeInfo = getExceptionTypeInfo(exc.exception_type);
                    return (
                      <div key={exc.id} className="bg-white p-4 rounded-lg border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span>{typeInfo.icon}</span>
                          <span className="font-medium text-gray-800">{typeInfo.label}</span>
                          <span className="text-sm text-gray-500">• {formatDate(exc.exception_date)}</span>
                        </div>
                        {exc.admin_notes && (
                          <p className="text-sm text-red-600">
                            Motivo: {exc.admin_notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {exceptions.length === 0 && (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <span className="text-4xl">📋</span>
                <h3 className="text-lg font-medium text-gray-800 mt-4">No tiene solicitudes de excepción</h3>
                <p className="text-gray-600 mt-2">
                  Use el botón "Nueva Solicitud" para pedir vacaciones, días libres u horas extra
                </p>
              </div>
            )}
          </>
        )}

        {/* Request Modal */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Nueva Solicitud</h2>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  {/* Exception Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Solicitud
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {EXCEPTION_TYPES.map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setRequestForm({ ...requestForm, exception_type: type.id })}
                          className={`p-3 rounded-lg border-2 text-left flex items-center gap-2 transition-all ${
                            requestForm.exception_type === type.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xl">{type.icon}</span>
                          <span className="text-sm font-medium">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha {requestForm.exception_type === 'vacation' ? 'Inicio' : ''}
                      </label>
                      <input
                        type="date"
                        value={requestForm.exception_date}
                        onChange={(e) => setRequestForm({ ...requestForm, exception_date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full border rounded-lg p-2"
                        required
                      />
                    </div>
                    
                    {requestForm.exception_type === 'vacation' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha Fin (opcional)
                        </label>
                        <input
                          type="date"
                          value={requestForm.end_date}
                          onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
                          min={requestForm.exception_date || new Date().toISOString().split('T')[0]}
                          className="w-full border rounded-lg p-2"
                        />
                      </div>
                    )}
                  </div>

                  {/* All Day Toggle */}
                  {['extra_hours', 'schedule_change'].includes(requestForm.exception_type) && (
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_all_day"
                          checked={requestForm.is_all_day}
                          onChange={(e) => setRequestForm({ ...requestForm, is_all_day: e.target.checked })}
                          className="w-4 h-4 text-blue-600"
                        />
                        <label htmlFor="is_all_day" className="text-sm text-gray-700">
                          Todo el día
                        </label>
                      </div>

                      {!requestForm.is_all_day && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hora Inicio
                            </label>
                            <input
                              type="time"
                              value={requestForm.exception_start_time}
                              onChange={(e) => setRequestForm({ ...requestForm, exception_start_time: e.target.value })}
                              className="w-full border rounded-lg p-2"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Hora Fin
                            </label>
                            <input
                              type="time"
                              value={requestForm.exception_end_time}
                              onChange={(e) => setRequestForm({ ...requestForm, exception_end_time: e.target.value })}
                              className="w-full border rounded-lg p-2"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo / Comentarios
                    </label>
                    <textarea
                      value={requestForm.reason}
                      onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                      rows="3"
                      className="w-full border rounded-lg p-2"
                      placeholder="Describe el motivo de tu solicitud..."
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {submitting ? 'Enviando...' : 'Enviar Solicitud'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
