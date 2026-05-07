import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { ReportsModel } from '../../models';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  StarIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

const TABS = [
  { id: 'summary', name: 'Resumen', icon: PresentationChartBarIcon },
  { id: 'history', name: 'Historial', icon: TableCellsIcon },
  { id: 'ratings', name: 'Calificaciones', icon: StarIcon }
];

export default function DoctorReports() {
  const [activeTab, setActiveTab] = useState('summary');
  const [dateRange, setDateRange] = useState('month');
  const [appointments, setAppointments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [ratingsData, setRatingsData] = useState({ ratings: [], average: null, breakdown: {} });
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { startDate, endDate } = getDateRange(dateRange);
      
      // Fetch doctor's personal stats and appointments using new endpoints
      const [statsRes, appointmentsRes, ratingsRes] = await Promise.all([
        ReportsModel.getMyStats({ startDate, endDate }),
        ReportsModel.getMyAppointments({ startDate, endDate, limit: 100 }),
        ReportsModel.getMyRatings({ limit: 30 })
      ]);

      // Extract data (API returns { data: ... } wrapper)
      const stats = statsRes?.data || statsRes || {};
      const appts = appointmentsRes?.data || appointmentsRes || [];
      const ratings = ratingsRes?.data || ratingsRes || {};

      setStatistics({
        total_appointments: stats.totalAppointments || 0,
        completed_appointments: stats.completedAppointments || 0,
        cancelled_appointments: stats.cancelledAppointments || 0,
        pending_appointments: stats.pendingAppointments || 0,
        patients_treated: stats.uniquePatients || 0,
        completion_rate: stats.completionRate || 0
      });

      setAppointments(Array.isArray(appts) ? appts : []);
      
      setRatingsData({
        ratings: ratings.ratings || [],
        average: ratings.average,
        averagePunctuality: ratings.averagePunctuality,
        averageAttention: ratings.averageAttention,
        averageRecommendation: ratings.averageRecommendation,
        breakdown: ratings.breakdown || {},
        total: ratings.total || 0
      });
      
    } catch (err) {
      console.error('Error fetching report:', err);
      showNotification('Error al cargar reportes. Intente de nuevo.', 'error');
      // Reset to empty state on error
      setStatistics({
        total_appointments: 0,
        completed_appointments: 0,
        cancelled_appointments: 0,
        pending_appointments: 0,
        patients_treated: 0,
        completion_rate: 0
      });
      setAppointments([]);
      setRatingsData({ ratings: [], average: null, breakdown: {}, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;
    
    endDate = today.toISOString().split('T')[0];
    
    switch(range) {
      case 'today':
        startDate = endDate;
        break;
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      }
      case 'all':
        startDate = '2020-01-01';
        break;
      default: {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      }
    }
    
    return { startDate, endDate };
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const renderStars = (rating, size = 'w-5 h-5') => {
    if (!rating) return <span className="text-gray-400 text-sm">Sin calificación</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= Math.round(rating) ? (
            <StarSolidIcon key={star} className={`${size} text-yellow-400`} />
          ) : (
            <StarIcon key={star} className={`${size} text-gray-300`} />
          )
        ))}
        <span className="ml-2 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programada' },
      confirmed: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Confirmada' },
      'in-progress': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Progreso' },
      'no-show': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'No Asistió' }
    };
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status || 'Desconocido' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const completionRate = statistics?.completion_rate || 
    (statistics && statistics.total_appointments > 0 
      ? Math.round((statistics.completed_appointments / statistics.total_appointments) * 100) 
      : 0);

  return (
    <DoctorLayout>
      <div className="space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Reportes</h2>
            <p className="text-gray-600 text-sm mt-1">Analiza tu desempeño</p>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <label className="text-xs sm:text-sm font-medium text-gray-600 whitespace-nowrap">Período:</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="flex-1 sm:flex-none px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              style={{ fontSize: '16px' }}
            >
              <option value="today">Hoy</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
              <option value="year">Año</option>
              <option value="all">Todo</option>
            </select>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' :
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-300' :
            'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200 -mx-2 sm:mx-0 px-2 sm:px-0">
            <nav className="flex -mb-px overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium border-b-2 transition whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              {/* Tab: Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Main Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 sm:p-5 border border-blue-200">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs font-medium text-blue-700">Total Citas</p>
                        <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-blue-900">{statistics?.total_appointments || 0}</p>
                      <p className="text-[10px] sm:text-xs text-blue-600 mt-1 hidden sm:block">En el período</p>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 sm:p-5 border border-green-200">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs font-medium text-green-700">Completadas</p>
                        <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-green-900">{statistics?.completed_appointments || 0}</p>
                      <p className="text-[10px] sm:text-xs text-green-600 mt-1 hidden sm:block">{completionRate}% éxito</p>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-3 sm:p-5 border border-yellow-200">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs font-medium text-yellow-700">Pendientes</p>
                        <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-yellow-900">{statistics?.pending_appointments || 0}</p>
                      <p className="text-[10px] sm:text-xs text-yellow-600 mt-1 hidden sm:block">Por atender</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 sm:p-5 border border-purple-200">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <p className="text-xs font-medium text-purple-700">Pacientes</p>
                        <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                      </div>
                      <p className="text-xl sm:text-3xl font-bold text-purple-900">{statistics?.patients_treated || 0}</p>
                      <p className="text-[10px] sm:text-xs text-purple-600 mt-1 hidden sm:block">Únicos</p>
                    </div>
                  </div>

                  {/* Secondary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Rating Card */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-gray-600">Calificación</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                              {ratingsData.average?.toFixed(1) || '---'}
                            </span>
                            <span className="hidden sm:block">{ratingsData.average && renderStars(ratingsData.average)}</span>
                          </div>
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1">{ratingsData.total || 0} reseñas</p>
                        </div>
                        <StarSolidIcon className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-400 opacity-30" />
                      </div>
                    </div>

                    {/* Completion Chart */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
                      <p className="text-xs sm:text-sm font-medium text-gray-600 mb-3">Completación</p>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                          <svg className="w-16 h-16 sm:w-20 sm:h-20 -rotate-90">
                            <circle cx="50%" cy="50%" r="45%" stroke="#E5E7EB" strokeWidth="8" fill="none" />
                            <circle 
                              cx="50%" cy="50%" r="45%" 
                              stroke="#10B981" 
                              strokeWidth="8" 
                              fill="none"
                              strokeDasharray={`${completionRate * 2.26} 226`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-sm sm:text-lg font-bold text-gray-900">
                            {completionRate}%
                          </span>
                        </div>
                        <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-green-600 truncate">Completadas</span>
                            <span className="font-medium">{statistics?.completed_appointments || 0}</span>
                          </div>
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="text-red-600 truncate">Canceladas</span>
                            <span className="font-medium">{statistics?.cancelled_appointments || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Rating Details */}
                  {ratingsData.average && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-5 border border-blue-200">
                      <h4 className="font-medium text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Desglose</h4>
                      <div className="grid grid-cols-4 gap-2 sm:gap-4">
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-blue-700">{ratingsData.average?.toFixed(1) || '-'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">General</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-green-700">{ratingsData.averagePunctuality?.toFixed(1) || '-'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">Puntual</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-purple-700">{ratingsData.averageAttention?.toFixed(1) || '-'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">Atención</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg sm:text-2xl font-bold text-orange-700">{ratingsData.averageRecommendation?.toFixed(1) || '-'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-600">Recomienda</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export Options */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                      <DocumentArrowDownIcon className="w-5 h-5 text-gray-600" />
                      Exportar Reporte
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => showNotification('Descargando CSV...', 'success')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium flex items-center gap-2"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        CSV
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                      >
                        Imprimir
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: History */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {appointments.length > 0 ? (
                      appointments.map((apt, idx) => (
                        <div key={apt.id || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 text-sm truncate">{apt.patient_name || 'N/A'}</span>
                            {getStatusBadge(apt.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="text-gray-400">Fecha:</span> {formatDate(apt.scheduled_start)}
                            </div>
                            <div>
                              <span className="text-gray-400">Hora:</span> {formatTime(apt.scheduled_start)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 truncate">
                            {apt.reason || 'Consulta'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No hay citas</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Paciente</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Hora</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Motivo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {appointments.length > 0 ? (
                          appointments.map((apt, idx) => (
                            <tr key={apt.id || idx} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                {apt.patient_name || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatDate(apt.scheduled_start)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {formatTime(apt.scheduled_start)}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {apt.reason || 'Consulta'}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {getStatusBadge(apt.status)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                              No hay citas en el período seleccionado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {appointments.length > 0 && (
                    <div className="text-center text-sm text-gray-500">
                      Mostrando {appointments.length} registros
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Ratings */}
              {activeTab === 'ratings' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Rating Overview */}
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6 border border-yellow-200">
                    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                      <div className="text-center">
                        <p className="text-4xl sm:text-5xl font-bold text-gray-900">{ratingsData.average?.toFixed(1) || '---'}</p>
                        <div className="mt-2">{renderStars(ratingsData.average || 0, 'w-5 h-5 sm:w-6 sm:h-6')}</div>
                        <p className="text-xs sm:text-sm text-gray-600 mt-2">{ratingsData.total || 0} reseñas</p>
                      </div>
                      
                      {/* Rating Distribution */}
                      <div className="flex-1 space-y-1.5 sm:space-y-2 w-full sm:w-auto">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = ratingsData.breakdown?.[star] || 0;
                          const percentage = ratingsData.total > 0 ? (count / ratingsData.total) * 100 : 0;
                          
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 w-8">{star}★</span>
                              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-yellow-400 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-500 w-8">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Averages */}
                  {ratingsData.average && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white border rounded-lg p-4 text-center">
                        <StarSolidIcon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                        <p className="text-xl font-bold">{ratingsData.average?.toFixed(1)}</p>
                        <p className="text-xs text-gray-500">General</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4 text-center">
                        <ClockIcon className="w-6 h-6 text-green-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{ratingsData.averagePunctuality?.toFixed(1) || '-'}</p>
                        <p className="text-xs text-gray-500">Puntualidad</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4 text-center">
                        <UserGroupIcon className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{ratingsData.averageAttention?.toFixed(1) || '-'}</p>
                        <p className="text-xs text-gray-500">Atención</p>
                      </div>
                      <div className="bg-white border rounded-lg p-4 text-center">
                        <CheckCircleIcon className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                        <p className="text-xl font-bold">{ratingsData.averageRecommendation?.toFixed(1) || '-'}</p>
                        <p className="text-xs text-gray-500">Recomendación</p>
                      </div>
                    </div>
                  )}

                  {/* Comments */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Comentarios Recientes</h4>
                    {ratingsData.ratings.length > 0 ? (
                      <div className="space-y-4">
                        {ratingsData.ratings.map((rating, idx) => (
                          <div key={rating.id || idx} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {rating.patient_name || 'Paciente'}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {renderStars(rating.rating, 'w-4 h-4')}
                                  <span className="text-sm text-gray-500">
                                    {formatDate(rating.created_at)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {rating.comment && (
                              <p className="mt-3 text-gray-600 text-sm">{rating.comment}</p>
                            )}
                            {(rating.punctuality_rating || rating.attention_rating || rating.recommendation_rating) && (
                              <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 border-t pt-3">
                                {rating.punctuality_rating && (
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-3 h-3" />
                                    Puntualidad: {rating.punctuality_rating}/5
                                  </span>
                                )}
                                {rating.attention_rating && (
                                  <span className="flex items-center gap-1">
                                    <UserGroupIcon className="w-3 h-3" />
                                    Atención: {rating.attention_rating}/5
                                  </span>
                                )}
                                {rating.recommendation_rating && (
                                  <span className="flex items-center gap-1">
                                    <CheckCircleIcon className="w-3 h-3" />
                                    Recomendación: {rating.recommendation_rating}/5
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <StarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Aún no tienes calificaciones</p>
                        <p className="text-sm mt-1">Las calificaciones aparecerán aquí cuando los pacientes evalúen tus consultas</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
}
