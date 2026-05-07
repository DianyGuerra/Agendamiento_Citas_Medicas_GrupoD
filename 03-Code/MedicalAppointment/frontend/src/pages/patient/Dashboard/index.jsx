/**
 * PatientDashboard Page
 * Main dashboard for patient users showing stats, appointments, and health summary
 */
import PatientLayout from '../../../layouts/PatientLayout';
import { useAuth } from '../../../context/AuthContext';
import {
  CalendarIcon,
  CheckCircleIcon,
  BeakerIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '../shared';
import { useDashboardData } from './hooks';
import {
  StatCard,
  NextAppointmentCard,
  RecentHistoryCard,
  NotificationsCard,
  QuickActionsCard,
  HealthSummaryCard,
  RemindersCard,
} from './components';

export default function PatientDashboard() {
  const { user } = useAuth();
  const {
    loading,
    stats,
    nextAppointment,
    recentHistory,
    healthSummary,
    recentNotifications,
  } = useDashboardData();

  if (loading) {
    return (
      <PatientLayout>
        <LoadingSpinner message="Cargando dashboard..." />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Bienvenido/a, {user?.first_name} 👋</h1>
          <p className="text-blue-100">Gestiona tus citas médicas y consulta tu historial de salud</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Citas Próximas"
            value={stats.upcomingAppointments}
            icon={CalendarIcon}
            color="text-blue-600"
            bgColor="bg-blue-50"
            link="/patient/appointments"
          />
          <StatCard
            title="Citas Completadas"
            value={stats.completedAppointments}
            icon={CheckCircleIcon}
            color="text-green-600"
            bgColor="bg-green-50"
            link="/patient/history"
          />
          <StatCard
            title="Resultados Pendientes"
            value={stats.pendingResults}
            icon={BeakerIcon}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            link="/patient/lab"
          />
          <StatCard
            title="Recetas Activas"
            value={stats.activePrescriptions}
            icon={DocumentTextIcon}
            color="text-purple-600"
            bgColor="bg-purple-50"
            link="/patient/prescriptions"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <NextAppointmentCard appointment={nextAppointment} />
            <RecentHistoryCard history={recentHistory} />
            <NotificationsCard notifications={recentNotifications} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <QuickActionsCard />
            <HealthSummaryCard healthSummary={healthSummary} stats={stats} />
            <RemindersCard />
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
