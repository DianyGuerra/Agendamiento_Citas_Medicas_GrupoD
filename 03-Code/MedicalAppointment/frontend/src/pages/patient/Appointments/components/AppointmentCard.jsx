/**
 * AppointmentCard Component
 * Displays an individual appointment with details and actions
 */
import {
  ClockIcon,
  MapPinIcon,
  UserIcon,
  ArrowPathIcon,
  StarIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { APPOINTMENT_STATUS } from '../../shared/constants';

function formatDate(dateString) {
  const date = new Date(dateString);
  return {
    day: date.getDate(),
    month: date.toLocaleString('es-EC', { month: 'short' }).toUpperCase(),
    time: date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
    fullDate: date.toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

function getStatusBadge(status) {
  const config = APPOINTMENT_STATUS[status] || { label: status, className: 'bg-gray-500 text-white' };
  return (
    <span className={`px-3 py-1 rounded-md text-xs font-bold ${config.className}`}>
      {config.label}
    </span>
  );
}

export default function AppointmentCard({ 
  appointment, 
  isRated, 
  onReschedule, 
  onCancel, 
  onRate 
}) {
  const dateInfo = formatDate(appointment.scheduled_start);
  const isPast = new Date(appointment.scheduled_start) < new Date();

  return (
    <div className="border border-gray-200 rounded-xl hover:shadow-md transition-all overflow-hidden bg-white">
      <div className="flex flex-col md:flex-row">
        {/* Calendar Date Box */}
        <div className={`flex-shrink-0 w-full md:w-32 flex md:flex-col items-center justify-center p-6 md:border-r border-gray-200 ${
          isPast ? 'bg-gray-100' : 'bg-gradient-to-br from-green-100 to-green-200'
        }`}>
          <div className="text-center">
            <div className={`text-5xl font-bold ${isPast ? 'text-gray-600' : 'text-green-700'}`}>
              {dateInfo.day}
            </div>
            <div className={`text-sm font-semibold mt-1 ${isPast ? 'text-gray-500' : 'text-green-600'}`}>
              {dateInfo.month}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="flex-1 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-2 rounded-full">
                <UserIcon className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  {appointment.specialty_name}
                </p>
              </div>
            </div>
            {getStatusBadge(appointment.status_code)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-700">
              <div className="bg-blue-100 p-2 rounded-lg">
                <ClockIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Hora</p>
                <p className="font-semibold text-sm">{dateInfo.time}</p>
              </div>
            </div>

            {appointment.location && (
              <div className="flex items-center gap-2 text-gray-700">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <MapPinIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Consultorio</p>
                  <p className="font-semibold text-sm">{appointment.location}</p>
                </div>
              </div>
            )}
          </div>

          {appointment.reason && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <p className="text-xs text-gray-600 mb-1">
                <span className="font-semibold">Motivo:</span>
              </p>
              <p className="text-sm text-gray-800">{appointment.reason}</p>
            </div>
          )}

          {/* Action Buttons */}
          {appointment.status_code !== 'cancelled' &&
            appointment.status_code !== 'completed' &&
            !isPast && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => onReschedule(appointment)}
                  className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm flex items-center gap-2"
                >
                  <ArrowPathIcon className="h-4 w-4" />
                  Reagendar
                </button>
                <button
                  onClick={() => onCancel(appointment)}
                  className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold text-sm"
                >
                  Cancelar Cita
                </button>
              </div>
            )}

          {/* Rating Button for Completed Appointments */}
          {appointment.status_code === 'completed' && (
            <div className="mt-4">
              {isRated ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">Ya calificaste esta cita</span>
                </div>
              ) : (
                <button
                  onClick={() => onRate(appointment)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold text-sm flex items-center gap-2"
                >
                  <StarIcon className="h-4 w-4" />
                  Calificar al Doctor
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
