import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { DoctorModel, ScheduleModel } from '../../models';
import {
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

const DAYS = [
  { id: 0, name: 'Domingo', short: 'Dom' },
  { id: 1, name: 'Lunes', short: 'Lun' },
  { id: 2, name: 'Martes', short: 'Mar' },
  { id: 3, name: 'Miércoles', short: 'Mié' },
  { id: 4, name: 'Jueves', short: 'Jue' },
  { id: 5, name: 'Viernes', short: 'Vie' },
  { id: 6, name: 'Sábado', short: 'Sáb' },
];

const EXCEPTION_TYPES = [
  { id: 'vacation', label: 'Vacaciones', icon: '🏖️', color: 'blue' },
  { id: 'day_off', label: 'Día libre', icon: '🏠', color: 'gray' },
  { id: 'extra_hours', label: 'Horas extra', icon: '⏰', color: 'green' },
  { id: 'holiday_work', label: 'Trabajar feriado', icon: '🎉', color: 'purple' },
  { id: 'schedule_change', label: 'Cambio de horario', icon: '📅', color: 'orange' },
];

export default function ScheduleManagement() {
  const [activeTab, setActiveTab] = useState('schedules');
  const [doctors, setDoctors] = useState([]);
  const [pendingExceptions, setPendingExceptions] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  const [exceptionFilter, setExceptionFilter] = useState('pending');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  
  const [scheduleForm, setScheduleForm] = useState({
    doctor_id: '',
    schedules: DAYS.map(day => ({
      day_of_week: day.id,
      start_time: '08:00',
      end_time: '17:00',
      break_start_time: '12:00',
      break_end_time: '13:00',
      is_working_day: day.id >= 1 && day.id <= 5
    }))
  });

  const [expandedDoctors, setExpandedDoctors] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'exceptions') {
      loadExceptions();
    }
  }, [activeTab, exceptionFilter, doctorFilter]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [doctorsRes, pendingRes] = await Promise.all([
        DoctorModel.getAll(),
        ScheduleModel.getPendingExceptions().catch(() => ({ data: [] }))
      ]);
      setDoctors(doctorsRes.data || doctorsRes || []);
      setPendingExceptions(pendingRes.data || pendingRes || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorSchedule = async (doctorId) => {
    try {
      const response = await ScheduleModel.getByDoctorId(doctorId);
      return response.data || response || [];
    } catch (error) {
      console.error('Error loading schedule:', error);
      return [];
    }
  };

  const loadExceptions = async () => {
    try {
      setLoading(true);
      let response;
      
      if (exceptionFilter === 'pending') {
        response = await ScheduleModel.getPendingExceptions();
      } else {
        response = await ScheduleModel.getAllExceptions({ status: exceptionFilter !== 'all' ? exceptionFilter : undefined });
      }
      
      let data = response.data || response || [];
      
      if (doctorFilter) {
        data = data.filter(e => e.doctor_id === doctorFilter);
      }
      
      setExceptions(data);
    } catch (error) {
      console.error('Error loading exceptions:', error);
      setExceptions([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDoctorExpand = async (doctorId) => {
    if (expandedDoctors[doctorId]) {
      setExpandedDoctors(prev => ({ ...prev, [doctorId]: null }));
    } else {
      const schedule = await loadDoctorSchedule(doctorId);
      setExpandedDoctors(prev => ({ ...prev, [doctorId]: schedule }));
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await ScheduleModel.approveException(selectedRequest.id, { admin_notes: adminNotes });
      showNotification('Solicitud aprobada exitosamente', 'success');
      setShowReviewModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      loadInitialData();
      if (activeTab === 'exceptions') loadExceptions();
    } catch (error) {
      console.error('Error approving request:', error);
      showNotification('Error al aprobar solicitud', 'error');
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    if (!adminNotes.trim()) {
      showNotification('Debe proporcionar un motivo de rechazo', 'error');
      return;
    }
    
    try {
      await ScheduleModel.rejectException(selectedRequest.id, { admin_notes: adminNotes });
      showNotification('Solicitud rechazada', 'success');
      setShowReviewModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      loadInitialData();
      if (activeTab === 'exceptions') loadExceptions();
    } catch (error) {
      console.error('Error rejecting request:', error);
      showNotification('Error al rechazar solicitud', 'error');
    }
  };

  const handleSaveSchedule = async () => {
    if (!scheduleForm.doctor_id) {
      showNotification('Debe seleccionar un doctor', 'error');
      return;
    }
    
    try {
      await ScheduleModel.bulkCreate(scheduleForm.doctor_id, scheduleForm.schedules);
      showNotification('Horario guardado exitosamente', 'success');
      setShowScheduleModal(false);
      if (expandedDoctors[scheduleForm.doctor_id]) {
        const schedule = await loadDoctorSchedule(scheduleForm.doctor_id);
        setExpandedDoctors(prev => ({ ...prev, [scheduleForm.doctor_id]: schedule }));
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showNotification('Error al guardar horario', 'error');
    }
  };

  const openScheduleModal = (doctor = null) => {
    if (doctor) {
      setScheduleForm(prev => ({ ...prev, doctor_id: doctor.id }));
      loadDoctorSchedule(doctor.id).then(schedule => {
        if (schedule.length > 0) {
          const updatedSchedules = DAYS.map(day => {
            const existing = schedule.find(s => s.day_of_week === day.id);
            if (existing) {
              // Normalize null values to empty strings or defaults for inputs
              return {
                ...existing,
                start_time: existing.start_time || '08:00',
                end_time: existing.end_time || '17:00',
                break_start_time: existing.break_start_time || '',
                break_end_time: existing.break_end_time || '',
              };
            }
            return {
              day_of_week: day.id,
              start_time: '08:00',
              end_time: '17:00',
              break_start_time: '12:00',
              break_end_time: '13:00',
              is_working_day: false
            };
          });
          setScheduleForm(prev => ({ ...prev, schedules: updatedSchedules }));
        }
      });
    } else {
      setScheduleForm({
        doctor_id: '',
        schedules: DAYS.map(day => ({
          day_of_week: day.id,
          start_time: '08:00',
          end_time: '17:00',
          break_start_time: '12:00',
          break_end_time: '13:00',
          is_working_day: day.id >= 1 && day.id <= 5
        }))
      });
    }
    setShowScheduleModal(true);
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowReviewModal(true);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
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

  const getExceptionTypeInfo = (type) => {
    return EXCEPTION_TYPES.find(t => t.id === type) || { label: type, icon: '📋', color: 'gray' };
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

  const getDoctorName = (doctor) => {
    if (!doctor) return 'N/A';
    if (doctor.users) {
      return `${doctor.users.first_name} ${doctor.users.last_name}`;
    }
    return `${doctor.first_name || ''} ${doctor.last_name || ''}`.trim() || 'N/A';
  };

  const applyDefaultSchedule = () => {
    setScheduleForm(prev => ({
      ...prev,
      schedules: DAYS.map(day => ({
        day_of_week: day.id,
        start_time: '08:00',
        end_time: '17:00',
        break_start_time: '12:00',
        break_end_time: '13:00',
        is_working_day: day.id >= 1 && day.id <= 5
      }))
    }));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Horarios y Excepciones</h2>
            <p className="text-sm sm:text-base text-gray-600">Gestión de horarios de doctores y solicitudes de cambios</p>
          </div>
          
          {pendingExceptions.length > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 sm:px-4 py-2">
              <ExclamationCircleIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                {pendingExceptions.length} solicitud(es) pendiente(s)
              </span>
            </div>
          )}
        </div>

        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('schedules')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'schedules'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Horarios Base</span>
              <span className="sm:hidden">Horarios</span>
            </button>
            <button
              onClick={() => setActiveTab('exceptions')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'exceptions'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Solicitudes de Excepciones</span>
              <span className="sm:hidden">Excepciones</span>
              {pendingExceptions.length > 0 && (
                <span className="bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                  {pendingExceptions.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === 'schedules' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="relative flex-1 sm:max-w-md">
                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar doctor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <button
                onClick={() => openScheduleModal()}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm"
              >
                <PlusIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Asignar Horario</span>
                <span className="sm:hidden">Asignar</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {doctors
                    .filter(d => {
                      const name = getDoctorName(d).toLowerCase();
                      return name.includes(searchTerm.toLowerCase());
                    })
                    .map((doctor) => (
                      <div key={doctor.id} className="bg-white">
                        <button
                          key={doctor.id}
                          type="button"
                          onClick={() => toggleDoctorExpand(doctor.id)}
                          aria-label={`Expandir información del doctor ${doctor.name}`}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                              <span className="text-primary-700 font-medium">
                                {getDoctorName(doctor).charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{getDoctorName(doctor)}</h4>
                              <p className="text-sm text-gray-500">
                                {doctor.specialty?.name || doctor.specialties?.name || 'Sin especialidad'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openScheduleModal(doctor);
                              }}
                              className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50"
                            >
                              <PencilSquareIcon className="w-5 h-5" />
                            </button>
                            {expandedDoctors[doctor.id] ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        
                        {expandedDoctors[doctor.id] && (
                          <div className="px-3 sm:px-4 pb-4 bg-gray-50">
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                              {DAYS.map((day) => {
                                const schedule = expandedDoctors[doctor.id]?.find(s => s.day_of_week === day.id);
                                return (
                                  <div
                                    key={day.id}
                                    className={`p-2 rounded-lg text-center text-xs sm:text-sm ${
                                      schedule?.is_working_day
                                        ? 'bg-green-100 border border-green-200'
                                        : 'bg-gray-100 border border-gray-200'
                                    }`}
                                  >
                                    <div className="font-medium text-gray-700">{day.short}</div>
                                    {schedule?.is_working_day ? (
                                      <>
                                        <div className="text-xs text-green-700">
                                          {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                        </div>
                                        {schedule.break_start_time && (
                                          <div className="text-xs text-gray-500 hidden sm:block">
                                            Desc: {formatTime(schedule.break_start_time)}
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="text-xs text-gray-500">No labora</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filtros:</span>
                </div>
                
                <div className="grid grid-cols-2 sm:flex sm:flex-row gap-3">
                  <select
                    value={exceptionFilter}
                    onChange={(e) => setExceptionFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobadas</option>
                    <option value="rejected">Rechazadas</option>
                    <option value="all">Todas</option>
                  </select>
                  
                  <select
                    value={doctorFilter}
                    onChange={(e) => setDoctorFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Todos los doctores</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{getDoctorName(d)}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                </div>
              ) : exceptions.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay solicitudes {exceptionFilter !== 'all' ? exceptionFilter === 'pending' ? 'pendientes' : exceptionFilter === 'approved' ? 'aprobadas' : 'rechazadas' : ''}
                </div>
              ) : (
                <>
                  {/* Mobile Cards View */}
                  <div className="lg:hidden divide-y divide-gray-200">
                    {exceptions.map((exception) => {
                      const typeInfo = getExceptionTypeInfo(exception.exception_type);
                      return (
                        <div key={exception.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-gray-900 text-sm truncate">
                                {exception.doctor?.users?.first_name} {exception.doctor?.users?.last_name}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {exception.doctor?.specialty?.name || ''}
                              </p>
                            </div>
                            {getStatusBadge(exception.status)}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100">
                              <span>{typeInfo.icon}</span>
                              {typeInfo.label}
                            </span>
                            <span>{formatDate(exception.exception_date)}</span>
                          </div>
                          <p className="text-xs text-gray-600 truncate mb-3">
                            {exception.reason || '-'}
                          </p>
                          <button
                            onClick={() => openReviewModal(exception)}
                            className={`text-sm font-medium ${
                              exception.status === 'pending' 
                                ? 'text-primary-600 hover:text-primary-800' 
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                          >
                            {exception.status === 'pending' ? 'Revisar' : 'Ver detalles'}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motivo</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {exceptions.map((exception) => {
                          const typeInfo = getExceptionTypeInfo(exception.exception_type);
                          return (
                            <tr key={exception.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="font-medium text-gray-900">
                                  {exception.doctor?.users?.first_name} {exception.doctor?.users?.last_name}
                                </div>
                              <div className="text-sm text-gray-500">
                                {exception.doctor?.specialty?.name || ''}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                <span>{typeInfo.icon}</span>
                                {typeInfo.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatDate(exception.exception_date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {exception.is_all_day ? (
                                <span className="text-gray-500">Todo el día</span>
                              ) : (
                                `${formatTime(exception.exception_start_time)} - ${formatTime(exception.exception_end_time)}`
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                              {exception.reason || '-'}
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(exception.status)}
                            </td>
                            <td className="px-4 py-3">
                              {exception.status === 'pending' ? (
                                <button
                                  onClick={() => openReviewModal(exception)}
                                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                                >
                                  Revisar
                                </button>
                              ) : (
                                <button
                                  onClick={() => openReviewModal(exception)}
                                  className="text-gray-500 hover:text-gray-700 text-sm"
                                >
                                  Ver detalles
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>
          </div>
        )}

        {showScheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                  {scheduleForm.doctor_id ? 'Editar Horario' : 'Asignar Horario'}
                </h3>
              </div>
              
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <span className="block text-sm font-medium text-gray-700 mb-2">Doctor</span>
                  <select
                    value={scheduleForm.doctor_id}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, doctor_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Seleccionar doctor</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>{getDoctorName(d)}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={applyDefaultSchedule}
                    className="text-xs sm:text-sm text-primary-600 hover:text-primary-800"
                  >
                    Aplicar horario estándar (Lun-Vie 8:00-17:00)
                  </button>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {DAYS.map((day, index) => {
                    const schedule = scheduleForm.schedules[index];
                    return (
                      <div key={day.id} className={`p-3 sm:p-4 rounded-lg border ${schedule.is_working_day ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2 sm:mb-3">
                          <span className="font-medium text-gray-800 text-sm sm:text-base">{day.name}</span>
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={schedule.is_working_day}
                              onChange={(e) => {
                                const updated = [...scheduleForm.schedules];
                                updated[index].is_working_day = e.target.checked;
                                setScheduleForm(prev => ({ ...prev, schedules: updated }));
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-600">Día laboral</span>
                          </label>
                        </div>
                        
                        {schedule.is_working_day && (
                          <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div>
                              <span className="block text-xs text-gray-500 mb-1">Hora inicio</span>
                              <input
                                type="time"
                                value={schedule.start_time || ''}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.schedules];
                                  updated[index].start_time = e.target.value;
                                  setScheduleForm(prev => ({ ...prev, schedules: updated }));
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                style={{ fontSize: '16px' }}
                              />
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 mb-1">Hora fin</span>
                              <input
                                type="time"
                                value={schedule.end_time || ''}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.schedules];
                                  updated[index].end_time = e.target.value;
                                  setScheduleForm(prev => ({ ...prev, schedules: updated }));
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                style={{ fontSize: '16px' }}
                              />
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 mb-1">Inicio descanso</span>
                              <input
                                type="time"
                                value={schedule.break_start_time || ''}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.schedules];
                                  updated[index].break_start_time = e.target.value;
                                  setScheduleForm(prev => ({ ...prev, schedules: updated }));
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                style={{ fontSize: '16px' }}
                              />
                            </div>
                            <div>
                              <span className="block text-xs text-gray-500 mb-1">Fin descanso</span>
                              <input
                                type="time"
                                value={schedule.break_end_time || ''}
                                onChange={(e) => {
                                  const updated = [...scheduleForm.schedules];
                                  updated[index].break_end_time = e.target.value;
                                  setScheduleForm(prev => ({ ...prev, schedules: updated }));
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                style={{ fontSize: '16px' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSchedule}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
                >
                  Guardar Horario
                </button>
              </div>
            </div>
          </div>
        )}

        {showReviewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">
                  {selectedRequest.status === 'pending' ? 'Revisar Solicitud' : 'Detalle de Solicitud'}
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs text-gray-500">Doctor</span>
                    <p className="font-medium text-gray-800">
                      {selectedRequest.doctor?.users?.first_name} {selectedRequest.doctor?.users?.last_name}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Tipo</span>
                    <p className="font-medium text-gray-800">
                      {getExceptionTypeInfo(selectedRequest.exception_type).icon} {getExceptionTypeInfo(selectedRequest.exception_type).label}
                    </p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Fecha</span>
                    <p className="font-medium text-gray-800">{formatDate(selectedRequest.exception_date)}</p>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-500">Horario</span>
                    <p className="font-medium text-gray-800">
                      {selectedRequest.is_all_day 
                        ? 'Todo el día' 
                        : `${formatTime(selectedRequest.exception_start_time)} - ${formatTime(selectedRequest.exception_end_time)}`
                      }
                    </p>
                  </div>
                </div>
                
                <div>
                  <span className="block text-xs text-gray-500">Motivo del doctor</span>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
                    {selectedRequest.reason || 'Sin motivo especificado'}
                  </p>
                </div>

                {selectedRequest.status === 'pending' ? (
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Notas del administrador
                    </span>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                      placeholder="Agregar notas (requerido para rechazar)..."
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <span className="block text-xs text-gray-500">Estado</span>
                      <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                    </div>
                    {selectedRequest.admin_notes && (
                      <div>
                        <span className="block text-xs text-gray-500">Notas del administrador</span>
                        <p className="mt-1 p-3 bg-gray-50 rounded-lg text-gray-700">
                          {selectedRequest.admin_notes}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReviewModal(false);
                    setSelectedRequest(null);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cerrar
                </button>
                {selectedRequest.status === 'pending' && (
                  <>
                    <button
                      onClick={handleRejectRequest}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      Rechazar
                    </button>
                    <button
                      onClick={handleApproveRequest}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
                    >
                      <CheckCircleIcon className="w-5 h-5" />
                      Aprobar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
