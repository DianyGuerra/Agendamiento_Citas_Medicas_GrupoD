import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { AppointmentModel } from '../../models';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generalStats, setGeneralStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalSpecialties: 0,
    upcomingAppointments: 0,
  });
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    byStatus: {},
    byMonth: {},
    byDayOfWeek: {},
  });
  const [doctorStats, setDoctorStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    bySpecialty: {},
  });
  const [advancedStats, setAdvancedStats] = useState({
    averageDailyAppointments: 0,
    averageAppointmentsPerDoctor: 0,
    cancellationRate: 0,
    completionRate: 0,
    noShowRate: 0,
    peakHours: {},
    doctorPerformance: [],
    specialtyPerformance: [],
    timeMetrics: {
      averageAdvanceBooking: 0,
      averageDuration: 0,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [generalRes, appointmentRes, doctorRes, advancedRes] = await Promise.all([
        AppointmentModel.getGeneralStats(),
        AppointmentModel.getAppointmentStats(),
        AppointmentModel.getDoctorStats(),
        AppointmentModel.getAdvancedStats(),
      ]);

      console.log('Advanced Stats Response:', advancedRes); // Para debug

      setGeneralStats(generalRes.data || generalRes || {});
      // appointmentRes returns { data, summary, filters, generatedAt }
      // We need the summary object
      const aptData = appointmentRes.data || appointmentRes || {};
      setAppointmentStats(aptData.summary || aptData || {});
      setDoctorStats(doctorRes.data || doctorRes || {});
      setAdvancedStats(advancedRes.data || advancedRes || {});
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      console.error('Error details:', error.response?.data); // Para ver más detalles
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
  const csvHeader = 'Categoría,Métrica,Valor\n';
  const csvRows = [
    '=== ESTADÍSTICAS GENERALES ===',
    `General,Total Doctores,${generalStats.totalDoctors}`,
    `General,Doctores Activos,${generalStats.activeDoctors}`,
    `General,Total Especialidades,${generalStats.totalSpecialties}`,
    `General,Próximas Citas,${generalStats.upcomingAppointments}`,
    '',
    '=== ESTADÍSTICAS DE CITAS ===',
    `Citas,Total,${appointmentStats.total}`,
    '',
    'Citas por Estado,Estado,Cantidad',
    ...Object.entries(appointmentStats.byStatus || {}).map(([status, count]) => 
      `Citas por Estado,${status},${count}`
    ),
    '',
    'Citas por Mes,Mes,Cantidad',
    ...Object.entries(appointmentStats.byMonth || {}).map(([month, count]) => 
      `Citas por Mes,${month},${count}`
    ),
    '',
    '=== MÉTRICAS AVANZADAS ===',
    `Promedios,Citas Diarias Promedio,${advancedStats.averageDailyAppointments}`,
    `Promedios,Citas por Doctor Promedio,${advancedStats.averageAppointmentsPerDoctor}`,
    `Promedios,Duración Promedio (min),${advancedStats.timeMetrics?.averageDuration}`,
    `Promedios,Anticipación Promedio (días),${advancedStats.timeMetrics?.averageAdvanceBooking}`,
    '',
    '=== TASAS DE RENDIMIENTO ===',
    `Tasas,Tasa de Cancelación (%),${advancedStats.cancellationRate}`,
    `Tasas,Tasa de Completitud (%),${advancedStats.completionRate}`,
    `Tasas,Tasa de No Show (%),${advancedStats.noShowRate}`,
    '',
    '=== HORAS PICO ===',
    ...Object.entries(advancedStats.peakHours || {}).map(([hour, count]) => 
      `Horas Pico,${hour},${count} citas`
    ),
    '',
    '=== PERFORMANCE POR DOCTOR ===',
    'Doctor,Total Citas,Completadas,Canceladas,No Show,Tasa Completitud (%),Score Eficiencia',
    ...(advancedStats.doctorPerformance || []).map(d => 
      `${d.doctorName},${d.totalAppointments},${d.completedAppointments},${d.cancelledAppointments},${d.noShowAppointments},${d.completionRate},${d.efficiencyScore}`
    ),
    '',
    '=== PERFORMANCE POR ESPECIALIDAD ===',
    'Especialidad,Total Citas,Completadas,Duración Promedio (min),Tasa Completitud (%),Score Demanda',
    ...(advancedStats.specialtyPerformance || []).map(s => 
      `${s.specialtyName},${s.totalAppointments},${s.completedAppointments},${s.averageDuration},${s.completionRate},${s.demandScore}`
    ),
    '',
    '=== DOCTORES POR ESPECIALIDAD ===',
    'Especialidad,Total,Activos,Inactivos',
    ...Object.entries(doctorStats.bySpecialty || {}).map(([specialty, data]) => 
      `${specialty},${data.total},${data.active},${data.inactive}`
    ),
  ].join('\n');

  const csv = csvHeader + csvRows;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reporte-completo-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

  // Chart: Citas por Estado (Pie)
  const statusChartData = {
    labels: Object.keys(appointmentStats.byStatus || {}),
    datasets: [
      {
        label: 'Citas',
        data: Object.values(appointmentStats.byStatus || {}),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(106, 165, 103, 0.8)',
          'rgba(212, 175, 55, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(106, 165, 103, 1)',
          'rgba(212, 175, 55, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart: Citas por Mes (Bar)
  const monthChartData = {
    labels: Object.keys(appointmentStats.byMonth || {}),
    datasets: [
      {
        label: 'Número de Citas',
        data: Object.values(appointmentStats.byMonth || {}),
        backgroundColor: 'rgba(74, 144, 226, 0.8)',
        borderColor: 'rgba(74, 144, 226, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Chart: Citas por Día de la Semana (Bar)
  const dayOfWeekChartData = {
    labels: Object.keys(appointmentStats.byDayOfWeek || {}),
    datasets: [
      {
        label: 'Citas por Día',
        data: Object.values(appointmentStats.byDayOfWeek || {}),
        backgroundColor: 'rgba(106, 165, 103, 0.8)',
        borderColor: 'rgba(106, 165, 103, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Chart: Doctores por Especialidad (Bar)
  const specialtyChartData = {
    labels: Object.keys(doctorStats.bySpecialty || {}),
    datasets: [
      {
        label: 'Total',
        data: Object.values(doctorStats.bySpecialty || {}).map(d => d.total),
        backgroundColor: 'rgba(74, 144, 226, 0.8)',
        borderColor: 'rgba(74, 144, 226, 1)',
        borderWidth: 2,
      },
      {
        label: 'Activos',
        data: Object.values(doctorStats.bySpecialty || {}).map(d => d.active),
        backgroundColor: 'rgba(106, 165, 103, 0.8)',
        borderColor: 'rgba(106, 165, 103, 1)',
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2 truncate">
            Bienvenido/a, {user?.first_name || 'Admin'} 👋
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Panel de estadísticas y análisis del sistema
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md text-sm sm:text-base flex-shrink-0"
        >
          <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Descargar Reporte</span>
          <span className="sm:hidden">Reporte</span>
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
        <QuickStatCard
          title="Doctores Activos"
          value={generalStats.activeDoctors}
          total={generalStats.totalDoctors}
          icon={UserGroupIcon}
          color="blue"
        />
        <QuickStatCard
          title="Especialidades"
          value={Object.keys(doctorStats.bySpecialty || {}).length || 0}
          icon={BeakerIcon}
          color="green"
        />
        <QuickStatCard
          title="Próximas Citas"
          value={generalStats.upcomingAppointments}
          icon={CalendarIcon}
          color="yellow"
        />
        <QuickStatCard
          title="Total Citas"
          value={appointmentStats.total}
          icon={ClockIcon}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <QuickActionButton
            icon={CalendarIcon}
            label="Ver Calendario"
            href="/admin/calendar"
          />
          <QuickActionButton
            icon={UserGroupIcon}
            label="Gestionar Doctores"
            href="/admin/doctors"
          />
          <QuickActionButton
            icon={BeakerIcon}
            label="Especialidades"
            href="/admin/specialties"
          />
          <QuickActionButton
            icon={ChartBarIcon}
            label="Reportes"
            href="/admin/reports"
          />
        </div>
      </div>

    {/* Charts Section */}
      <div className="space-y-6 sm:space-y-8">
        {/* Citas por Estado y Performance por Doctor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ChartPieIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  Citas por Estado
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">Distribución actual</p>
              </div>
            </div>
            <div className="h-60 sm:h-80">
              {Object.keys(appointmentStats.byStatus || {}).length > 0 ? (
                <Pie data={statusChartData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  Top 5 Doctores - Score de Eficiencia
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">Basado en completitud y cancelaciones</p>
              </div>
            </div>
            <div className="h-60 sm:h-80">
              {(advancedStats.doctorPerformance || []).length > 0 ? (
                <Bar 
                  data={{
                    labels: (advancedStats.doctorPerformance || []).slice(0, 5).map(d => d.doctorName),
                    datasets: [{
                      label: 'Score de Eficiencia',
                      data: (advancedStats.doctorPerformance || []).slice(0, 5).map(d => parseFloat(d.efficiencyScore)),
                      backgroundColor: 'rgba(153, 102, 255, 0.8)',
                      borderColor: 'rgba(153, 102, 255, 1)',
                      borderWidth: 2,
                    }],
                  }} 
                  options={barChartOptions} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citas por Mes y Tasas de Rendimiento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ChartBarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  Citas por Mes
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">Tendencia mensual ordenada cronológicamente</p>
              </div>
            </div>
            <div className="h-60 sm:h-80">
              {Object.keys(appointmentStats.byMonth || {}).length > 0 ? (
                <Bar data={monthChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <ChartPieIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  Tasas de Rendimiento
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">Completitud, cancelación y no-show</p>
              </div>
            </div>
            <div className="h-60 sm:h-80">
              {advancedStats.completionRate || advancedStats.cancellationRate || advancedStats.noShowRate ? (
                <Doughnut 
                  data={{
                    labels: ['Completadas', 'Canceladas', 'No Show'],
                    datasets: [{
                      data: [
                        parseFloat(advancedStats.completionRate || 0),
                        parseFloat(advancedStats.cancellationRate || 0),
                        parseFloat(advancedStats.noShowRate || 0),
                      ],
                      backgroundColor: [
                        'rgba(106, 165, 103, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                      ],
                      borderColor: [
                        'rgba(106, 165, 103, 1)',
                        'rgba(255, 99, 132, 1)',
                        'rgba(255, 159, 64, 1)',
                      ],
                      borderWidth: 2,
                    }],
                  }} 
                  options={pieChartOptions} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance por Especialidad y Citas por Día de Semana */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                <BeakerIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  Performance por Especialidad
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">Total de citas y duración promedio</p>
              </div>
            </div>
            <div className="h-60 sm:h-80">
              {(advancedStats.specialtyPerformance || []).length > 0 ? (
                <Bar 
                  data={{
                    labels: (advancedStats.specialtyPerformance || []).map(s => s.specialtyName),
                    datasets: [
                      {
                        label: 'Total Citas',
                        data: (advancedStats.specialtyPerformance || []).map(s => s.totalAppointments),
                        backgroundColor: 'rgba(99, 102, 241, 0.8)',
                        borderColor: 'rgba(99, 102, 241, 1)',
                        borderWidth: 2,
                      },
                      {
                        label: 'Duración Prom. (min)',
                        data: (advancedStats.specialtyPerformance || []).map(s => s.averageDuration),
                        backgroundColor: 'rgba(212, 175, 55, 0.8)',
                        borderColor: 'rgba(212, 175, 55, 1)',
                        borderWidth: 2,
                      },
                    ],
                  }} 
                  options={barChartOptions} 
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                  Citas por Día de la Semana
                </h4>
                <p className="text-xs sm:text-sm text-gray-600">Distribución semanal</p>
              </div>
            </div>
            <div className="h-60 sm:h-80">
              {Object.keys(appointmentStats.byDayOfWeek || {}).length > 0 ? (
                <Bar data={dayOfWeekChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Métricas Calculadas en Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">Promedio Citas/Día</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{advancedStats.averageDailyAppointments || 0}</div>
            <div className="text-xs opacity-75 mt-1 sm:mt-2 hidden sm:block">Calculado sobre días activos</div>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">Promedio por Doctor</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{advancedStats.averageAppointmentsPerDoctor || 0}</div>
            <div className="text-xs opacity-75 mt-1 sm:mt-2 hidden sm:block">Citas por doctor</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">Duración Promedio</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{advancedStats.timeMetrics?.averageDuration || 0} <span className="text-sm sm:text-base">min</span></div>
            <div className="text-xs opacity-75 mt-1 sm:mt-2 hidden sm:block">Tiempo por cita</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="text-xs sm:text-sm opacity-90 mb-1 sm:mb-2">Anticipación Promedio</div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold">{advancedStats.timeMetrics?.averageAdvanceBooking || 0} <span className="text-sm sm:text-base">días</span></div>
            <div className="text-xs opacity-75 mt-1 sm:mt-2 hidden sm:block">Días de antelación</div>
          </div>
        </div>

        {/* Horas Pico */}
        {Object.keys(advancedStats.peakHours || {}).length > 0 && (
          <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white rounded-xl shadow-lg p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4"> Horas Pico de Mayor Demanda</h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-2 sm:gap-4">
              {Object.entries(advancedStats.peakHours || {})
                .sort((a, b) => b[1] - a[1])
                .map(([hour, count], idx) => (
                <div key={hour} className="bg-white/20 backdrop-blur rounded-lg p-3 sm:p-4">
                  <div className="text-lg sm:text-2xl font-bold">#{idx + 1}</div>
                  <div className="text-sm sm:text-lg font-semibold">{String(hour).padStart(2, '0')}:00</div>
                  <div className="text-xs sm:text-sm opacity-90">{count} {count === 1 ? 'cita' : 'citas'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tablas Detalladas de Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Tabla Performance Doctores */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              Performance por Doctor (Top 10)
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Completadas</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(advancedStats.doctorPerformance || []).slice(0, 10).map((doctor, index) => (
                      <tr key={doctor.doctorId || `doctor-${index}`} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 max-w-[100px] sm:max-w-none truncate">{doctor.doctorName}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">{doctor.totalAppointments}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">{doctor.completedAppointments}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            parseFloat(doctor.efficiencyScore) >= 80 ? 'bg-green-100 text-green-800' :
                            parseFloat(doctor.efficiencyScore) >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {doctor.efficiencyScore}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tabla Performance Especialidades */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
              Métricas por Especialidad
            </h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Especialidad</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Duración</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase">Tasa</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(advancedStats.specialtyPerformance || []).map((specialty, index) => (
                      <tr key={specialty.specialtyName || `specialty-${index}`} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm font-medium text-gray-900 max-w-[100px] sm:max-w-none truncate">{specialty.specialtyName}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">{specialty.totalAppointments}</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">{specialty.averageDuration} min</td>
                        <td className="px-2 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500">{specialty.completionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla Doctores por Especialidad (Original) */}
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
            Resumen Detallado de Doctores por Especialidad
          </h3>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Especialidad
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activos
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Inactivos
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(doctorStats.bySpecialty || {}).map(([specialty, data]) => (
                    <tr key={specialty} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900 max-w-[120px] sm:max-w-none truncate">
                        {specialty}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {data.total}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-green-600 font-medium">
                        {data.active}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-red-600 hidden sm:table-cell">
                        {data.inactive}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function QuickStatCard({ title, value, total, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl shadow-lg p-4 sm:p-6 transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <Icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-80" />
      </div>
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2">{value}</div>
      <div className="text-xs sm:text-sm opacity-90">
        {title}
        {total && ` (de ${total})`}
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-6 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all group"
    >
      <Icon className="w-6 h-6 sm:w-10 sm:h-10 text-blue-500 group-hover:text-white transition-colors" />
      <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-white text-center transition-colors">
        {label}
      </span>
    </a>
  );
}