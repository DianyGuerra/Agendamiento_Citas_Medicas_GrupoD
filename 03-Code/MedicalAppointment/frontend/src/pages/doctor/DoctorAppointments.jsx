import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import { AppointmentModel } from '../../models';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  PlayIcon,
  StopIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  ListBulletIcon,
  FunnelIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const VIEW_MODES = {
  CALENDAR: 'calendar',
  LIST: 'list'
};

const FILTER_TYPES = {
  ALL: 'all',
  UPCOMING: 'upcoming',
  TODAY: 'today',
  PAST: 'past',
  COMPLETED: 'completed'
};

export default function DoctorAppointments() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState(VIEW_MODES.CALENDAR);
  const [filterType, setFilterType] = useState(FILTER_TYPES.ALL);
  const [currentDate, setCurrentDate] = useState(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)));
  const [appointments, setAppointments] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(null);

  useEffect(() => {
    fetchAllAppointments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterType, allAppointments, currentDate, searchTerm, viewMode]);

  const fetchAllAppointments = async () => {
    try {
      setLoading(true);
      const response = await AppointmentModel.getDoctorAppointments();
      const appointmentsData = Array.isArray(response) ? response : response.data || [];
      setAllAppointments(appointmentsData);
    } catch (err) {
      setError('Error al cargar las citas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    
    let filtered = [...allAppointments];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(apt => 
        apt.patient_name?.toLowerCase().includes(term) ||
        apt.reason?.toLowerCase().includes(term)
      );
    }

    switch (filterType) {
      case FILTER_TYPES.TODAY:
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.scheduled_start);
          return aptDate >= today && aptDate < tomorrow;
        });
        break;
      case FILTER_TYPES.UPCOMING:
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.scheduled_start);
          return aptDate >= now;
        });
        break;
      case FILTER_TYPES.PAST:
        filtered = filtered.filter(apt => {
          const aptDate = new Date(apt.scheduled_start);
          return aptDate < now;
        });
        break;
      case FILTER_TYPES.COMPLETED:
        filtered = filtered.filter(apt => {
          const status = apt.status || apt.status_code;
          return status === 'completed';
        });
        break;
      default:
        break;
    }

    if (viewMode === VIEW_MODES.CALENDAR) {
      const weekStart = new Date(currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.scheduled_start);
        return aptDate >= weekStart && aptDate < weekEnd;
      });
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduled_start);
      const dateB = new Date(b.scheduled_start);
      return filterType === FILTER_TYPES.PAST ? dateB - dateA : dateA - dateB;
    });

    setAppointments(filtered);
  };

  const getWeekDays = () => {
    const week = [];
    const current = new Date(currentDate);
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_start);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    }).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    setCurrentDate(weekStart);
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  };

  const formatDate = (date) => {
    return date.getDate();
  };

  const formatFullDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStartConsultation = async (appointmentId) => {
    try {
      setActionLoading(true);
      await AppointmentModel.update(appointmentId, { status: 'in_progress' });
      showNotification('Consulta iniciada', 'success');
      navigate(`/doctor/consultation/${appointmentId}`, { state: { fromAgenda: true } });
    } catch (error) {
      showNotification('Error al iniciar la consulta', 'error');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteConsultation = async (appointmentId) => {
    try {
      setActionLoading(true);
      await AppointmentModel.update(appointmentId, { status: 'completed' });
      showNotification('Consulta completada', 'success');
      await fetchAllAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      showNotification('Error al completar la consulta', 'error');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckIn = async (appointmentId) => {
    try {
      setActionLoading(true);
      await AppointmentModel.update(appointmentId, { status: 'checked_in' });
      showNotification('Check-in registrado', 'success');
      await fetchAllAppointments();
      setSelectedAppointment(null);
    } catch (error) {
      showNotification('Error al registrar check-in', 'error');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewConsultation = (appointmentId) => {
    navigate(`/doctor/consultation/${appointmentId}`, { state: { fromAgenda: true } });
  };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-500',
      'confirmed': 'bg-indigo-500',
      'checked_in': 'bg-purple-500',
      'in_progress': 'bg-amber-500',
      'completed': 'bg-green-500',
      'cancelled': 'bg-red-500',
      'no_show': 'bg-gray-500',
      'rescheduled': 'bg-orange-500',
    };
    return colors[status] || 'bg-blue-600';
  };

  const getStatusBorderColor = (status) => {
    const colors = {
      'scheduled': 'border-blue-700',
      'confirmed': 'border-indigo-700',
      'checked_in': 'border-purple-700',
      'in_progress': 'border-amber-700',
      'completed': 'border-green-700',
      'cancelled': 'border-red-700',
      'no_show': 'border-gray-700',
      'rescheduled': 'border-orange-700',
    };
    return colors[status] || 'border-blue-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'scheduled': 'Agendada',
      'confirmed': 'Confirmada',
      'checked_in': 'En espera',
      'in_progress': 'En consulta',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'no_show': 'No asistió',
      'rescheduled': 'Reagendada',
    };
    return labels[status] || status;
  };

  const getAvailableActions = (appointment) => {
    const status = appointment.status || appointment.status_code || appointment.appointment_status?.code;
    const actions = [];
    
    // Check if appointment is today
    const appointmentDate = new Date(appointment.scheduled_start);
    const today = new Date();
    const isToday = appointmentDate.toDateString() === today.toDateString();

    switch (status) {
      case 'scheduled':
        // Allow starting consultation if it's today
        if (isToday) {
          actions.push({ key: 'start', label: 'Iniciar Consulta', icon: PlayIcon, color: 'green', handler: handleStartConsultation });
        }
        break;
      case 'confirmed':
        actions.push({ key: 'checkin', label: 'Check-in', icon: ClockIcon, color: 'purple', handler: handleCheckIn });
        // Allow starting consultation if it's today
        if (isToday) {
          actions.push({ key: 'start', label: 'Iniciar Consulta', icon: PlayIcon, color: 'green', handler: handleStartConsultation });
        }
        break;
      case 'checked_in':
        actions.push({ key: 'start', label: 'Iniciar Consulta', icon: PlayIcon, color: 'green', handler: handleStartConsultation });
        break;
      case 'in_progress':
        actions.push({ key: 'notes', label: 'Ir a Consulta', icon: DocumentTextIcon, color: 'blue', handler: () => navigate(`/doctor/consultation/${appointment.id}`, { state: { fromAgenda: true } }) });
        actions.push({ key: 'complete', label: 'Completar', icon: StopIcon, color: 'green', handler: handleCompleteConsultation });
        break;
      case 'completed':
        actions.push({ key: 'view', label: 'Ver Consulta', icon: EyeIcon, color: 'blue', handler: () => handleViewConsultation(appointment.id) });
        break;
      default:
        break;
    }

    return actions;
  };

  const weekDays = getWeekDays();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];
  const workingHours = Array.from({ length: 10 }, (_, i) => i + 8);

  const renderListView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {appointments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CalendarDaysIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm sm:text-base">No hay citas que mostrar con los filtros actuales</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Mobile Card View */}
          <div className="sm:hidden divide-y divide-gray-200">
            {appointments.map((apt) => {
              const status = apt.status || apt.status_code || apt.appointment_status?.code;
              const patientName = apt.patient_name || 
                `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim() || 
                'Paciente';
              const actions = getAvailableActions(apt);
              return (
                <div key={apt.id} className="p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}>
                      {getStatusLabel(status)}
                    </span>
                    <span className="text-xs text-gray-500">{formatFullDate(apt.scheduled_start)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{patientName}</p>
                      <p className="text-xs text-gray-500">{formatTime(apt.scheduled_start)} • {apt.reason || 'Consulta general'}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setSelectedAppointment(apt)}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {actions.slice(0, 1).map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.key}
                            onClick={() => action.handler(apt.id)}
                            disabled={actionLoading}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition disabled:opacity-50"
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop Table View */}
          <table className="w-full hidden sm:table">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hora</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase hidden md:table-cell">Motivo</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {appointments.map((apt) => {
                const status = apt.status || apt.status_code || apt.appointment_status?.code;
                const patientName = apt.patient_name || 
                  `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim() || 
                  'Paciente';
                const patientEmail = apt.patient_email || apt.patient?.email || '';
                const actions = getAvailableActions(apt);
                return (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900">
                      {formatFullDate(apt.scheduled_start)}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 font-medium">
                      {formatTime(apt.scheduled_start)}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">{patientName}</div>
                      <div className="text-xs text-gray-500 hidden lg:block">{patientEmail}</div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 hidden md:table-cell">
                      <span className="truncate block max-w-[150px]">{apt.reason || 'Consulta general'}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(status)}`}>
                        {getStatusLabel(status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedAppointment(apt)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Ver detalles"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {actions.slice(0, 2).map((action) => {
                          const Icon = action.icon;
                          const colorClasses = {
                            blue: 'text-blue-600 hover:bg-blue-50',
                            green: 'text-green-600 hover:bg-green-50',
                            purple: 'text-purple-600 hover:bg-purple-50',
                            gray: 'text-gray-600 hover:bg-gray-100',
                          };
                          return (
                            <button
                              key={action.key}
                              onClick={() => action.handler(apt.id)}
                              disabled={actionLoading}
                              className={`p-1.5 rounded transition ${colorClasses[action.color]} disabled:opacity-50`}
                              title={action.label}
                            >
                              <Icon className="w-5 h-5" />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCalendarView = () => (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex">
            <div className="w-16 bg-gray-50 border-b border-gray-200 p-2 font-semibold text-gray-700"></div>
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`flex-1 min-w-32 text-center p-2 border-b border-gray-200 ${
                  new Date().toDateString() === day.toDateString()
                    ? 'bg-blue-50 border-b-2 border-blue-600'
                    : 'bg-gray-50'
                }`}
              >
                <div className="font-medium text-xs text-gray-700">{formatDayName(day)}</div>
                <div className={`text-base font-bold ${
                  new Date().toDateString() === day.toDateString()
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}>
                  {formatDate(day)}
                </div>
              </div>
            ))}
          </div>

          {workingHours.map((hour) => (
            <div key={hour} className="flex border-b border-gray-200">
              <div className="w-16 bg-gray-50 p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">
                {hour}:00
              </div>
              {weekDays.map((day, dayIdx) => {
                const dayAppointments = getAppointmentsForDay(day);
                const hourAppointments = dayAppointments.filter(apt => {
                  const aptHour = new Date(apt.scheduled_start).getHours();
                  return aptHour === hour;
                });

                return (
                  <div
                    key={dayIdx}
                    className={`flex-1 min-w-32 p-1 relative min-h-12 ${
                      new Date().toDateString() === day.toDateString()
                        ? 'bg-blue-50'
                        : 'bg-white'
                    } hover:bg-gray-50 transition`}
                  >
                    {hourAppointments.map((apt, idx) => {
                      const status = apt.status || apt.status_code || apt.appointment_status?.code;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedAppointment(apt)}
                          className={`mb-0.5 p-1.5 rounded text-xs font-semibold text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all border-l-4 ${getStatusColor(status)} ${getStatusBorderColor(status)}`}
                          title={`${apt.patient_name || apt.patient?.first_name} - ${apt.reason || 'Consulta'} - ${getStatusLabel(status)}`}
                          aria-label="Seleccionar cita"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold">{formatTime(apt.scheduled_start)}</span>
                            <span className="text-[10px] opacity-90 bg-white/20 px-1 rounded">
                              {getStatusLabel(status).substring(0, 4)}
                            </span>
                          </div>
                          <div className="truncate font-medium">
                            {apt.patient_name || `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim()}
                          </div>
                          {apt.reason && (
                            <div className="truncate text-[10px] opacity-80 mt-0.5">
                              {apt.reason.length > 20 ? apt.reason.substring(0, 20) + '...' : apt.reason}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <DoctorLayout>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {notification.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
          {notification.type === 'error' && <ExclamationTriangleIcon className="w-5 h-5" />}
          {notification.type === 'warning' && <ExclamationTriangleIcon className="w-5 h-5" />}
          <span>{notification.message}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 hover:opacity-75"
          >
            ×
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{showConfirmModal.title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{showConfirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showConfirmModal.cancelText || 'Cancelar'}
              </button>
              <button
                onClick={showConfirmModal.onConfirm}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                {showConfirmModal.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mi Agenda</h2>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode(VIEW_MODES.CALENDAR)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md transition ${
                  viewMode === VIEW_MODES.CALENDAR
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden xs:inline">Calendario</span>
              </button>
              <button
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-md transition ${
                  viewMode === VIEW_MODES.LIST
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <ListBulletIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium hidden xs:inline">Lista</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
              {[
                { key: FILTER_TYPES.ALL, label: 'Todas' },
                { key: FILTER_TYPES.TODAY, label: 'Hoy' },
                { key: FILTER_TYPES.UPCOMING, label: 'Próximas' },
                { key: FILTER_TYPES.PAST, label: 'Pasadas' },
                { key: FILTER_TYPES.COMPLETED, label: 'Completadas' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterType(filter.key)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition whitespace-nowrap flex-shrink-0 ${
                    filterType === filter.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                style={{ fontSize: '16px' }}
              />
            </div>
          </div>
        </div>

        {viewMode === VIEW_MODES.CALENDAR && (
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-3 sm:p-4">
            <button
              onClick={goToPreviousWeek}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} -{' '}
                {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <button
                onClick={goToToday}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
              >
                Hoy
              </button>
            </div>
            
            <button
              onClick={goToNextWeek}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4">
          <p className="text-xs sm:text-sm font-medium text-gray-600 mb-2">Estados:</p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {['scheduled', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'].map((status) => (
              <div key={status} className="flex items-center gap-1 sm:gap-2">
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${getStatusColor(status)}`}></div>
                <span className="text-[10px] sm:text-xs text-gray-600">{getStatusLabel(status)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Mostrando {appointments.length} cita{appointments.length !== 1 ? 's' : ''}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          viewMode === VIEW_MODES.CALENDAR ? renderCalendarView() : renderListView()
        )}

        {selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
              {/* Header with status badge */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Detalles de la Cita</h3>
                  <span className={`inline-flex items-center px-3 py-1 mt-2 rounded-full text-sm font-medium text-white ${getStatusColor(selectedAppointment.status || selectedAppointment.status_code || selectedAppointment.appointment_status?.code)}`}>
                    {getStatusLabel(selectedAppointment.status || selectedAppointment.status_code || selectedAppointment.appointment_status?.code)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                    {(selectedAppointment.patient_name || selectedAppointment.patient?.first_name || 'P').charAt(0)}
                    {(selectedAppointment.patient?.last_name || '').charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedAppointment.patient_name || 
                       `${selectedAppointment.patient?.first_name || ''} ${selectedAppointment.patient?.last_name || ''}`.trim() || 
                       'Paciente'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {selectedAppointment.patient_email || selectedAppointment.patient?.email || 'Sin email registrado'}
                    </p>
                    {(selectedAppointment.patient?.phone_number || selectedAppointment.patient_phone) && (
                      <p className="text-sm text-gray-500">
                        📞 {selectedAppointment.patient?.phone_number || selectedAppointment.patient_phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase">Fecha</span>
                    <p className="text-gray-900">{formatFullDate(selectedAppointment.scheduled_start)}</p>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase">Hora</span>
                    <p className="text-gray-900">{formatTime(selectedAppointment.scheduled_start)}</p>
                  </div>
                </div>

                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase">Motivo</span>
                  <p className="text-gray-900">{selectedAppointment.reason || 'Consulta general'}</p>
                </div>

                {/* Additional patient info if available */}
                {(selectedAppointment.patient?.cedula || selectedAppointment.patient_cedula) && (
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase">Cédula</span>
                    <p className="text-gray-900">{selectedAppointment.patient?.cedula || selectedAppointment.patient_cedula}</p>
                  </div>
                )}

                {/* Scheduled end time */}
                {selectedAppointment.scheduled_end && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase">Hora Inicio</span>
                      <p className="text-gray-900 font-medium">{formatTime(selectedAppointment.scheduled_start)}</p>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-500 uppercase">Hora Fin</span>
                      <p className="text-gray-900">{formatTime(selectedAppointment.scheduled_end)}</p>
                    </div>
                  </div>
                )}

                {/* Room info if available */}
                {(selectedAppointment.consultation_rooms?.name || selectedAppointment.location) && (
                  <div>
                    <span className="block text-xs font-medium text-gray-500 uppercase">Consultorio</span>
                    <p className="text-gray-900">
                      {selectedAppointment.consultation_rooms?.name || selectedAppointment.location}
                      {selectedAppointment.consultation_rooms?.room_number && ` - Sala ${selectedAppointment.consultation_rooms.room_number}`}
                    </p>
                  </div>
                )}

                {(selectedAppointment.patient_allergies || selectedAppointment.allergies) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <span className="block text-xs font-bold text-red-700 uppercase mb-1">⚠️ Alergias</span>
                    <p className="text-red-700 text-sm font-medium">
                      {selectedAppointment.patient_allergies || selectedAppointment.allergies}
                    </p>
                  </div>
                )}

                {(() => {
                  const status = selectedAppointment.status || selectedAppointment.status_code;
                  if (status === 'scheduled' || status === 'confirmed') {
                    const now = new Date();
                    const aptTime = new Date(selectedAppointment.scheduled_start);
                    const diff = aptTime - now;
                    if (diff > 0) {
                      const minutes = Math.floor(diff / 60000);
                      const hours = Math.floor(minutes / 60);
                      const days = Math.floor(hours / 24);
                      let timeText;
                      if (days > 0) timeText = `En ${days} día${days > 1 ? 's' : ''} y ${hours % 24} hora${hours % 24 !== 1 ? 's' : ''}`;
                      else if (hours > 0) timeText = `En ${hours} hora${hours > 1 ? 's' : ''} y ${minutes % 60} minuto${minutes % 60 !== 1 ? 's' : ''}`;
                      else if (minutes <= 30) timeText = `⏰ ¡En ${minutes} minuto${minutes !== 1 ? 's' : ''}!`;
                      else timeText = `En ${minutes} minutos`;
                      
                      return (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <span className="block text-xs font-medium text-blue-700 uppercase mb-1">Tiempo para la cita</span>
                          <p className="text-blue-800 text-sm font-medium">{timeText}</p>
                        </div>
                      );
                    }
                  }
                  return null;
                })()}

                {getAvailableActions(selectedAppointment).length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <span className="block text-xs font-medium text-gray-500 uppercase mb-3">Acciones</span>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableActions(selectedAppointment).map((action) => {
                        const Icon = action.icon;
                        const colorClasses = {
                          blue: 'bg-blue-600 hover:bg-blue-700',
                          green: 'bg-green-600 hover:bg-green-700',
                          purple: 'bg-purple-600 hover:bg-purple-700',
                          gray: 'bg-gray-600 hover:bg-gray-700',
                          red: 'bg-red-600 hover:bg-red-700',
                        };
                        
                        return (
                          <button
                            key={action.key}
                            onClick={() => action.handler(selectedAppointment.id)}
                            disabled={actionLoading}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-white rounded-lg transition ${colorClasses[action.color]} disabled:opacity-50`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{action.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* View full consultation button for completed appointments */}
              {(() => {
                const status = selectedAppointment.status || selectedAppointment.status_code || selectedAppointment.appointment_status?.code;
                if (status === 'completed' || status === 'in_progress') {
                  return (
                    <button
                      onClick={() => navigate(`/doctor/consultation/${selectedAppointment.id}`, {
                        state: { fromAgenda: true }
                      })}
                      className="w-full mt-4 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2"
                    >
                      <DocumentTextIcon className="w-5 h-5" />
                      {status === 'completed' ? 'Ver Detalle de Consulta' : 'Ir a Consulta'}
                    </button>
                  );
                }
                return null;
              })()}

              <button
                onClick={() => setSelectedAppointment(null)}
                className="w-full mt-3 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
