/**
 * AppointmentSummary Component
 * Shows the appointment summary before confirmation
 */
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = Number.parseInt(hours);
  const period = hour >= 12 ? 'p. m.' : 'a. m.';
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
  return `${displayHour.toString().padStart(2, '0')}:${minutes} ${period}`;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day));
  return date.toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function AppointmentSummary({
  specialty,
  doctor,
  date,
  slot,
  reason,
  onReasonChange,
  onBack,
  onSubmit,
  loading,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de la Cita
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Especialidad</p>
            <p className="font-semibold text-gray-900">{specialty?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Doctor</p>
            <p className="font-semibold text-gray-900">
              Dr. {doctor?.first_name} {doctor?.last_name}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Fecha</p>
            <p className="font-semibold text-gray-900">{formatDate(date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Hora</p>
            <p className="font-semibold text-gray-900">
              {slot && formatTime(slot.time || slot.start)}
            </p>
          </div>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700 mb-2">
          Motivo de la Consulta *
        </span>
        <input
          type="text"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ej: Control de rutina, dolor de cabeza, etc."
        />
      </div>

      <div className="flex gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Volver
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            'Agendando...'
          ) : (
            <>
              <CheckCircleIcon className="h-5 w-5" />
              Confirmar Cita
            </>
          )}
        </button>
      </div>
    </form>
  );
}

AppointmentSummary.propTypes = {
  specialty: PropTypes.object.isRequired,     
  doctor: PropTypes.object.isRequired,        
  date: PropTypes.string.isRequired,          
  slot: PropTypes.object.isRequired,          
  reason: PropTypes.string.isRequired,        
  onReasonChange: PropTypes.func.isRequired,  
  onBack: PropTypes.func.isRequired,          
  onSubmit: PropTypes.func.isRequired,        
  loading: PropTypes.bool.isRequired,         
};
