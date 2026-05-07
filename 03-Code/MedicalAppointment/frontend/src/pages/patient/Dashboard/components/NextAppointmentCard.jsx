/**
 * NextAppointmentCard Component
 * Displays the next upcoming appointment or empty state
 */
import { Link } from 'react-router-dom';
import { CalendarIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

function formatDateTime(dateString) {
  return new Date(dateString).toLocaleString('es-EC', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NextAppointmentCard({ appointment }) {
  if (!appointment) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Próxima Cita</h2>
        <div className="text-center py-8">
          <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No tienes citas programadas</p>
          <Link
            to="/patient/new-appointment"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            📅 Agendar Nueva Cita
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Próxima Cita</h2>
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
          <p className="text-sm text-gray-600 mb-2">📅 Fecha y Hora</p>
          <p className="font-bold text-gray-900 text-lg">
            {formatDateTime(appointment.scheduled_start)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Doctor</p>
            <p className="font-semibold text-gray-900">
              Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Especialidad</p>
            <p className="font-semibold text-gray-900">{appointment.specialty_name}</p>
          </div>
        </div>
        {appointment.reason && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-600 mb-1">Motivo</p>
            <p className="text-gray-900">{appointment.reason}</p>
          </div>
        )}
        <Link
          to="/patient/appointments"
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Ver Detalles
          <ArrowRightIcon className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
