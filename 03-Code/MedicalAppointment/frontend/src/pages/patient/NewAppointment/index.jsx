/**
 * NewAppointment Page
 * Multi-step wizard for creating a new appointment
 */
import PatientLayout from '../../../layouts/PatientLayout';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Notification } from '../shared';
import { useNewAppointment } from './hooks';
import { SlotSelector, AppointmentSummary, StepIndicator } from './components';

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

export default function NewAppointment() {
  const {
    loading,
    step,
    notification,
    specialties,
    doctors,
    availableSlots,
    searchParams,
    selectedSlot,
    reason,
    setReason,
    handleSearchChange,
    handleSlotSelect,
    handleBack,
    handleSubmit,
    getSelectedSpecialty,
    getSelectedDoctor,
    navigate,
  } = useNewAppointment();

  return (
    <PatientLayout>
      <div className="space-y-6">
        {notification && (
          <Notification type={notification.type} message={notification.message} />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <button
              onClick={() => navigate('/patient/appointments')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm"
            >
              <ArrowLeftIcon className="h-4 w-4 md:h-5 md:w-5" />
              Volver a Mis Citas
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Agendar Nueva Cita
            </h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Busque por especialidad, doctor y seleccione un horario disponible
            </p>
          </div>

          <div className="p-4 md:p-6">
            <StepIndicator currentStep={step} totalSteps={2} />

            {step === 1 && (
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad *
                    </label>
                    <select
                      value={searchParams.specialty_id}
                      onChange={(e) => handleSearchChange('specialty_id', e.target.value)}
                      className="w-full px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base bg-white"
                    >
                      <option value="">Seleccione una especialidad</option>
                      {specialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor *
                    </label>
                    <select
                      value={searchParams.doctor_id}
                      onChange={(e) => handleSearchChange('doctor_id', e.target.value)}
                      disabled={!searchParams.specialty_id}
                      className="w-full px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base bg-white"
                    >
                      <option value="">Seleccione un doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={searchParams.date}
                      onChange={(e) => handleSearchChange('date', e.target.value)}
                      min={getTodayDate()}
                      disabled={!searchParams.doctor_id}
                      className="w-full px-3 md:px-4 py-2.5 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm md:text-base bg-white"
                    />
                  </div>
                </div>

                <SlotSelector
                  slots={availableSlots}
                  date={searchParams.doctor_id && searchParams.date ? searchParams.date : ''}
                  onSelect={handleSlotSelect}
                  loading={loading}
                />
              </div>
            )}

            {step === 2 && (
              <AppointmentSummary
                specialty={getSelectedSpecialty()}
                doctor={getSelectedDoctor()}
                date={searchParams.date}
                slot={selectedSlot}
                reason={reason}
                onReasonChange={setReason}
                onBack={handleBack}
                onSubmit={handleSubmit}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
