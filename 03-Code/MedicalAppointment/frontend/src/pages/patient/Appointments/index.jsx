/**
 * PatientAppointments Page
 * Displays and manages patient appointments with filtering and actions
 */
import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PatientLayout from '../../../layouts/PatientLayout';
import { CalendarIcon, PlusIcon } from '@heroicons/react/24/outline';
import { LoadingSpinner, Notification, TabNavigation, EmptyState } from '../shared';
import { useAppointments } from './hooks';
import { AppointmentCard, CancelModal, RescheduleModal, RatingModal } from './components';

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'upcoming', label: 'Próximas' },
  { id: 'past', label: 'Pasadas' },
  { id: 'cancelled', label: 'Canceladas' },
];

export default function PatientAppointments() {
  const {
    appointments,
    loading,
    notification,
    ratedAppointments,
    cancelAppointment,
    rescheduleAppointment,
    loadAvailableSlots,
    submitRating,
  } = useAppointments();

  const [activeTab, setActiveTab] = useState('upcoming');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          `${apt.doctor_first_name} ${apt.doctor_last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          apt.specialty_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(
          (apt) => new Date(apt.scheduled_start) >= now && apt.status_code !== 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(
          (apt) => new Date(apt.scheduled_start) < now && apt.status_code !== 'cancelled'
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((apt) => apt.status_code === 'cancelled');
        break;
      default:
        break;
    }

    // Sort appointments
    if (activeTab === 'all') {
      const statusOrder = (apt) => {
        if (apt.status_code === 'completed') return 0;
        if ((apt.status_code === 'scheduled' || apt.status_code === 'confirmed') && new Date(apt.scheduled_start) >= now) return 1;
        if (apt.status_code === 'cancelled') return 2;
        return 3;
      };
      return filtered.sort((a, b) => {
        const orderA = statusOrder(a);
        const orderB = statusOrder(b);
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.scheduled_start) - new Date(a.scheduled_start);
      });
    }
    return filtered.sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
  }, [appointments, activeTab, searchTerm]);

  const handleCancel = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleReschedule = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRate = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRatingModal(true);
  };

  const confirmCancel = async () => {
    if (selectedAppointment) {
      const success = await cancelAppointment(selectedAppointment.id);
      if (success) {
        setShowCancelModal(false);
        setSelectedAppointment(null);
      }
    }
  };

  const confirmReschedule = async (newScheduledStart) => {
    if (selectedAppointment) {
      const success = await rescheduleAppointment(selectedAppointment.id, newScheduledStart);
      if (success) {
        setShowRescheduleModal(false);
        setSelectedAppointment(null);
      }
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <LoadingSpinner message="Cargando citas..." />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {notification && (
          <Notification type={notification.type} message={notification.message} />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
                <p className="text-gray-600 mt-1">Gestiona tus citas médicas programadas</p>
              </div>
              <Link
                to="/patient/new-appointment"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Nueva Cita
              </Link>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-gray-50 px-6">
            <TabNavigation tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Buscar por doctor o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Appointments List */}
          <div className="p-6">
            {filteredAppointments.length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="No hay citas"
                description={
                  activeTab === 'all'
                    ? 'No tienes citas programadas'
                    : `No hay citas ${TABS.find((t) => t.id === activeTab)?.label.toLowerCase()}`
                }
                action={{
                  label: 'Agendar Nueva Cita',
                  to: '/patient/new-appointment',
                  icon: PlusIcon,
                }}
              />
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    isRated={ratedAppointments.has(appointment.id)}
                    onReschedule={handleReschedule}
                    onCancel={handleCancel}
                    onRate={handleRate}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {showCancelModal && (
          <CancelModal
            appointment={selectedAppointment}
            onConfirm={confirmCancel}
            onClose={() => {
              setShowCancelModal(false);
              setSelectedAppointment(null);
            }}
          />
        )}

        {showRescheduleModal && (
          <RescheduleModal
            appointment={selectedAppointment}
            onConfirm={confirmReschedule}
            onClose={() => {
              setShowRescheduleModal(false);
              setSelectedAppointment(null);
            }}
            loadAvailableSlots={loadAvailableSlots}
          />
        )}

        {showRatingModal && (
          <RatingModal
            appointment={selectedAppointment}
            onSubmit={submitRating}
            onClose={() => {
              setShowRatingModal(false);
              setSelectedAppointment(null);
            }}
          />
        )}
      </div>
    </PatientLayout>
  );
}
