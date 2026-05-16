import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DoctorLayout from '../../layouts/DoctorLayout';
import { AppointmentModel, DoctorModel, PrescriptionModel, DoctorRatingModel, ScheduleModel, NotificationModel } from '../../models';
import { useAuth } from '../../context/AuthContext';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  PlayIcon,
  BellAlertIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChartBarIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  StarIcon,
  ArrowPathIcon,
  XCircleIcon,
  MegaphoneIcon
} from '@heroicons/react/24/outline';

// Storage key for tracking read notifications
const READ_NOTIFICATIONS_KEY = 'doctor_read_notifications';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingActions, setPendingActions] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [stats, setStats] = useState({
    todayCount: 0,
    weekCount: 0,
    completedToday: 0,
    pendingToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentNotifications();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await AppointmentModel.getDoctorAppointments();
      const allAppointments = Array.isArray(response) ? response : response.data || [];
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      // Filter today's appointments
      const todayApts = allAppointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_start || apt.appointment_date);
        return aptDate >= today && aptDate < tomorrow;
      }).sort((a, b) => new Date(a.scheduled_start || a.start_time) - new Date(b.scheduled_start || b.start_time));
      
      setTodayAppointments(todayApts);
      
      // Filter upcoming appointments (next 7 days, excluding completed)
      const upcoming = allAppointments
        .filter(apt => {
          const aptDate = new Date(apt.scheduled_start || apt.appointment_date);
          return aptDate >= today && aptDate <= weekEnd && apt.status_code !== 'completed' && apt.status_code !== 'cancelled';
        })
        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
        .slice(0, 8);
      
      setAppointments(upcoming);
      
      // Calculate stats
      const completedToday = todayApts.filter(apt => apt.status_code === 'completed').length;
      const pendingToday = todayApts.filter(apt => apt.status_code !== 'completed' && apt.status_code !== 'cancelled').length;
      const weekApts = allAppointments.filter(apt => {
        const aptDate = new Date(apt.scheduled_start || apt.appointment_date);
        return aptDate >= today && aptDate <= weekEnd;
      }).length;
      
      setStats({
        todayCount: todayApts.length,
        weekCount: weekApts,
        completedToday,
        pendingToday
      });
      
      // Generate pending actions
      const actions = [];
      
      // Citas próximas a comenzar (en los próximos 30 minutos)
      const now = new Date();
      const in30min = new Date(now.getTime() + 30 * 60000);
      const nearApts = todayApts.filter(apt => {
        const aptTime = new Date(apt.scheduled_start);
        return aptTime >= now && aptTime <= in30min && apt.status_code === 'scheduled';
      });
      
      nearApts.forEach(apt => {
        actions.push({
          id: `start-${apt.id}`,
          type: 'start_consultation',
          title: `Iniciar consulta con ${apt.patient_name || 'Paciente'}`,
          description: `Programada para ${formatTime(apt.scheduled_start)}`,
          priority: 'high',
          appointmentId: apt.id
        });
      });
      
      // Citas confirmadas pendientes de iniciar
      const confirmedWaiting = todayApts.filter(apt => 
        (apt.status_code === 'confirmed' || apt.status_code === 'scheduled') && 
        new Date(apt.scheduled_start) <= now
      );
      
      confirmedWaiting.forEach(apt => {
        if (!actions.find(a => a.appointmentId === apt.id)) {
          actions.push({
            id: `waiting-${apt.id}`,
            type: 'start_consultation',
            title: `Paciente esperando: ${apt.patient_name || 'Paciente'}`,
            description: `Cita a las ${formatTime(apt.scheduled_start)}`,
            priority: 'urgent',
            appointmentId: apt.id
          });
        }
      });
      
      setPendingActions(actions.slice(0, 5));
      
    } catch (err) {
      setError('Error al cargar el dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch recent notifications for the dashboard
   */
  const fetchRecentNotifications = async () => {
    try {
      const readNotifications = JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || '[]');
      const notifications = [];
      const now = new Date();

      // Get recent appointments for notifications
      try {
        const appointmentsResponse = await AppointmentModel.getDoctorAppointments({ 
          limit: 20,
          includeCancelled: 'true'
        });
        const appointments = appointmentsResponse?.data || appointmentsResponse || [];
        
        appointments.forEach(apt => {
          const createdAt = new Date(apt.created_at);
          const createdHoursAgo = (now - createdAt) / (1000 * 60 * 60);
          const patientName = apt.patient_name || apt.patient?.user?.first_name 
            ? `${apt.patient?.user?.first_name || ''} ${apt.patient?.user?.last_name || ''}`.trim() 
            : 'Paciente';

          // New appointments in last 48 hours
          if ((apt.status_code === 'scheduled' || apt.status_code === 'confirmed') && createdHoursAgo <= 48) {
            const notifId = `apt-new-${apt.id}`;
            notifications.push({
              id: notifId,
              type: 'new_appointment',
              title: 'Nueva cita agendada',
              message: `${patientName} ha agendado una cita`,
              date: apt.created_at,
              isRead: readNotifications.includes(notifId)
            });
          }

          // Cancelled appointments in last 48 hours
          if (apt.status_code === 'cancelled') {
            const cancelledAt = new Date(apt.updated_at || apt.created_at);
            const cancelledHoursAgo = (now - cancelledAt) / (1000 * 60 * 60);
            if (cancelledHoursAgo <= 48) {
              const notifId = `apt-cancel-${apt.id}`;
              notifications.push({
                id: notifId,
                type: 'cancelled',
                title: 'Cita cancelada',
                message: `${patientName} canceló su cita`,
                date: apt.updated_at || apt.created_at,
                isRead: readNotifications.includes(notifId)
              });
            }
          }
        });
      } catch (e) {
        console.log('[Dashboard] Could not fetch appointments notifications');
      }

      // Get pending renewals
      try {
        const renewalsResponse = await PrescriptionModel.getRenewals({
          status: 'pending',
          limit: 5
        });
        const renewals = renewalsResponse?.data || renewalsResponse || [];
        renewals.forEach(r => {
          const notifId = `renewal-pending-${r.id}`;
          const patientName = r.patient?.user?.first_name 
            ? `${r.patient.user.first_name} ${r.patient.user.last_name}` 
            : 'Paciente';
          notifications.push({
            id: notifId,
            type: 'renewal',
            title: 'Solicitud de renovación',
            message: `${patientName} solicita renovación`,
            date: r.created_at,
            isRead: readNotifications.includes(notifId)
          });
        });
      } catch (e) {
        console.log('[Dashboard] Could not fetch renewals notifications');
      }

      // Get recent ratings
      try {
        const ratingsResponse = await DoctorRatingModel.getByDoctor(user?.doctorId || user?.id, { limit: 5 });
        const ratings = ratingsResponse?.data || ratingsResponse || [];
        ratings.forEach(r => {
          const ratedAt = new Date(r.created_at);
          const ratedHoursAgo = (now - ratedAt) / (1000 * 60 * 60);
          if (ratedHoursAgo <= 72) {
            const notifId = `rating-${r.id}`;
            notifications.push({
              id: notifId,
              type: 'rating',
              title: 'Nueva calificación',
              message: `Calificación de ${r.rating} estrellas`,
              date: r.created_at,
              isRead: readNotifications.includes(notifId)
            });
          }
        });
      } catch (e) {
        console.log('[Dashboard] Could not fetch ratings notifications');
      }

      // Get schedule exceptions
      try {
        const exceptionsResponse = await ScheduleModel.getMyExceptionRequests();
        const exceptions = Array.isArray(exceptionsResponse) ? exceptionsResponse : exceptionsResponse?.data || [];
        exceptions.forEach(exc => {
          const excDate = new Date(exc.reviewed_at || exc.created_at);
          const excHoursAgo = (now - excDate) / (1000 * 60 * 60);
          
          if (exc.status === 'approved' && excHoursAgo <= 72) {
            const notifId = `schedule-approved-${exc.id}`;
            notifications.push({
              id: notifId,
              type: 'schedule_approved',
              title: 'Solicitud aprobada',
              message: 'Tu solicitud de horario fue aprobada',
              date: exc.reviewed_at || exc.updated_at,
              isRead: readNotifications.includes(notifId)
            });
          } else if (exc.status === 'rejected' && excHoursAgo <= 72) {
            const notifId = `schedule-rejected-${exc.id}`;
            notifications.push({
              id: notifId,
              type: 'schedule_rejected',
              title: 'Solicitud rechazada',
              message: 'Tu solicitud de horario fue rechazada',
              date: exc.reviewed_at || exc.updated_at,
              isRead: readNotifications.includes(notifId)
            });
          }
        });
      } catch (e) {
        console.log('[Dashboard] Could not fetch schedule exceptions notifications');
      }

      // Get system notifications
      try {
        const dbNotifications = await NotificationModel.getUserNotifications({ limit: 5 });
        dbNotifications.forEach(n => {
          const notifId = `db-${n.id}`;
          notifications.push({
            id: notifId,
            type: 'system',
            title: n.title,
            message: n.message?.substring(0, 50) + (n.message?.length > 50 ? '...' : ''),
            date: n.created_at,
            isRead: readNotifications.includes(notifId) || n.is_read
          });
        });
      } catch (e) {
        console.log('[Dashboard] Could not fetch system notifications');
      }

      // Sort by date and get top 5
      notifications.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentNotifications(notifications.slice(0, 5));
    } catch (error) {
      console.error('[Dashboard] Error fetching notifications:', error);
    }
  };

  /**
   * Get time ago string from date
   */
  const getTimeAgo = (date) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  /**
   * Get notification icon and color based on type
   */
  const getNotificationStyle = (type) => {
    switch (type) {
      case 'new_appointment':
        return { icon: CalendarIcon, bg: 'bg-blue-100', color: 'text-blue-600' };
      case 'cancelled':
        return { icon: XCircleIcon, bg: 'bg-red-100', color: 'text-red-600' };
      case 'renewal':
        return { icon: ArrowPathIcon, bg: 'bg-yellow-100', color: 'text-yellow-600' };
      case 'rating':
        return { icon: StarIcon, bg: 'bg-green-100', color: 'text-green-600' };
      case 'schedule_approved':
        return { icon: CheckCircleIcon, bg: 'bg-green-100', color: 'text-green-600' };
      case 'schedule_rejected':
        return { icon: XCircleIcon, bg: 'bg-red-100', color: 'text-red-600' };
      case 'system':
        return { icon: MegaphoneIcon, bg: 'bg-indigo-100', color: 'text-indigo-600' };
      default:
        return { icon: BellAlertIcon, bg: 'bg-gray-100', color: 'text-gray-600' };
    }
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    // Adjust for Monday start (0 = Sunday in JS, we want Monday = 0)
    return firstDay === 0 ? 6 : firstDay - 1;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleStartConsultation = (appointmentId) => {
    navigate(`/doctor/consultation/${appointmentId}`, {
      state: { fromDashboard: true }
    });
  };

  const monthName = currentDate.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric'
  });

  const calendarDays = generateCalendarDays();
  const todayDate = new Date();

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-1 sm:mb-2">
                ¡Buenos días, Doctor!
              </h2>
              <p className="text-blue-100 text-sm sm:text-base">
                {todayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="text-center flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-white/20 rounded-lg">
                <p className="text-2xl sm:text-3xl font-bold">{stats.pendingToday}</p>
                <p className="text-xs sm:text-sm text-blue-100">Pendientes</p>
              </div>
              <div className="text-center flex-1 sm:flex-initial px-3 sm:px-4 py-2 bg-white/20 rounded-lg">
                <p className="text-2xl sm:text-3xl font-bold">{stats.completedToday}</p>
                <p className="text-xs sm:text-sm text-blue-100">Completadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
          <Link
            to="/doctor/appointments"
            className="bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition flex items-center gap-2 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">Ver Citas</p>
              <p className="text-xs text-gray-500 hidden sm:block">Gestionar agenda</p>
            </div>
          </Link>
          
          <Link
            to="/doctor/patients"
            className="bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition flex items-center gap-2 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">Pacientes</p>
              <p className="text-xs text-gray-500 hidden sm:block">Ver historial</p>
            </div>
          </Link>
          
          <Link
            to="/doctor/prescriptions"
            className="bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition flex items-center gap-2 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <DocumentTextIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">Recetas</p>
              <p className="text-xs text-gray-500 hidden sm:block">Historial</p>
            </div>
          </Link>
          
          <Link
            to="/doctor/reports"
            className="bg-white rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition flex items-center gap-2 sm:gap-3"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
              <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">Reportes</p>
              <p className="text-xs text-gray-500 hidden sm:block">Estadísticas</p>
            </div>
          </Link>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Today's Agenda */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                <span className="hidden xs:inline">Mi </span>Agenda Hoy
              </h3>
              <Link to="/doctor/appointments" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm flex items-center gap-1 flex-shrink-0">
                Ver todas <ArrowRightIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No hay citas programadas para hoy</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt, idx) => {
                  const aptTime = new Date(apt.scheduled_start);
                  const now = new Date();
                  const isPast = aptTime < now;
                  const isNow = aptTime <= now && apt.status_code !== 'completed';
                  
                  return (
                    <div
                      key={apt.id}
                      className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-lg border transition ${
                        isNow 
                          ? 'border-blue-300 bg-blue-50' 
                          : apt.status_code === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {/* Mobile: Time + Patient Row */}
                      <div className="flex items-center gap-3 sm:hidden">
                        <div className={`text-center min-w-[50px] px-2 py-1 rounded ${isNow ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          <p className={`text-sm font-bold ${isNow ? 'text-blue-600' : 'text-gray-700'}`}>
                            {formatTime(apt.scheduled_start).split(':')[0]}:{formatTime(apt.scheduled_start).split(':')[1].split(' ')[0]}
                          </p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">{apt.patient_name || 'Paciente'}</p>
                          <p className="text-xs text-gray-600 truncate">{apt.reason || 'Consulta general'}</p>
                        </div>
                      </div>
                      
                      {/* Desktop: Time */}
                      <div className="hidden sm:block text-center w-16">
                        <p className={`text-lg font-bold ${isNow ? 'text-blue-600' : 'text-gray-700'}`}>
                          {formatTime(apt.scheduled_start).split(':')[0]}:{formatTime(apt.scheduled_start).split(':')[1].split(' ')[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTime(apt.scheduled_start).split(' ')[1]}
                        </p>
                      </div>
                      
                      {/* Desktop: Patient Info */}
                      <div className="hidden sm:block flex-1">
                        <p className="font-semibold text-gray-800">{apt.patient_name || 'Paciente'}</p>
                        <p className="text-sm text-gray-600">{apt.reason || 'Consulta general'}</p>
                      </div>
                      
                      {/* Status & Action */}
                      <div className="flex items-center gap-2 sm:gap-2 justify-end sm:justify-start">
                        {apt.status_code === 'completed' ? (
                          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">Completada</span>
                          </span>
                        ) : apt.status_code === 'cancelled' ? (
                          <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            Cancelada
                          </span>
                        ) : apt.status_code === 'in_progress' ? (
                          <button
                            onClick={() => handleStartConsultation(apt.id)}
                            className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 hover:bg-blue-700"
                          >
                            <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            Continuar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStartConsultation(apt.id)}
                            className="px-2 sm:px-3 py-1 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1 hover:bg-blue-700"
                          >
                            <PlayIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                            Iniciar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Pending Actions */}
            {pendingActions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BellAlertIcon className="w-5 h-5 text-orange-500" />
                  Acciones Pendientes
                </h4>
                <div className="space-y-2">
                  {pendingActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        if (action.type === 'start_consultation') {
                          handleStartConsultation(action.appointmentId);
                        }
                      }}
                      aria-label="Acción de cita"
                      className={`p-3 rounded-lg cursor-pointer transition ${
                        action.priority === 'urgent'
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100'
                          : action.priority === 'high'
                          ? 'bg-orange-50 border border-orange-200 hover:bg-orange-100'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <ExclamationCircleIcon className={`w-5 h-5 flex-shrink-0 ${
                          action.priority === 'urgent' ? 'text-red-500' : 'text-orange-500'
                        }`} />
                        <div>
                          <p className="text-sm font-medium text-gray-800">{action.title}</p>
                          <p className="text-xs text-gray-500">{action.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Mini Calendar */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">Calendario</h4>
              </div>

              <div className="flex items-center justify-between mb-3">
                <button onClick={goToPreviousMonth} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeftIcon className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700 capitalize">{monthName}</span>
                <button onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  const isToday = day === todayDate.getDate() &&
                    currentDate.getMonth() === todayDate.getMonth() &&
                    currentDate.getFullYear() === todayDate.getFullYear();
                  
                  return (
                    <div
                      key={index}
                      className={`aspect-square flex items-center justify-center text-xs rounded ${
                        day === null
                          ? ''
                          : isToday
                          ? 'bg-blue-600 text-white font-bold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Esta Semana</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total citas</span>
                  <span className="font-bold text-gray-800">{stats.weekCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hoy</span>
                  <span className="font-bold text-blue-600">{stats.todayCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completadas hoy</span>
                  <span className="font-bold text-green-600">{stats.completedToday}</span>
                </div>
              </div>
            </div>

            {/* Recent Notifications */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <BellAlertIcon className="w-5 h-5 text-blue-500" />
                  Notificaciones
                </h4>
                <Link to="/doctor/notifications" className="text-xs text-blue-600 hover:text-blue-700">
                  Ver todas
                </Link>
              </div>
              {recentNotifications.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No hay notificaciones recientes</p>
              ) : (
                <div className="space-y-2">
                  {recentNotifications.map((notif) => {
                    const style = getNotificationStyle(notif.type);
                    const IconComponent = style.icon;
                    return (
                      <Link
                        key={notif.id}
                        to="/doctor/notifications"
                        className={`flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition ${
                          !notif.isRead ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${style.bg} flex-shrink-0`}>
                          <IconComponent className={`w-4 h-4 ${style.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className={`text-xs font-medium truncate ${!notif.isRead ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notif.title}
                            </p>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{notif.message}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{getTimeAgo(notif.date)}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800">Próximas Citas (7 días)</h3>
            <Link to="/doctor/appointments" className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm">
              Ver calendario completo
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay citas próximas programadas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {appointments.map((apt) => (
                <button
                  key={apt.id}
                  type="button"
                  onClick={() => handleStartConsultation(apt.id)}
                  aria-label="Iniciar consulta"
                  className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                    <span className="text-xs sm:text-sm text-gray-600">{formatDate(apt.scheduled_start)}</span>
                  </div>
                  <p className="font-semibold text-gray-800 text-sm sm:text-base mb-1 truncate">{apt.patient_name || 'Paciente'}</p>
                  <p className="text-xs sm:text-sm text-gray-500">{formatTime(apt.scheduled_start)}</p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    apt.status_code === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {apt.status_label || 'Pendiente'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
