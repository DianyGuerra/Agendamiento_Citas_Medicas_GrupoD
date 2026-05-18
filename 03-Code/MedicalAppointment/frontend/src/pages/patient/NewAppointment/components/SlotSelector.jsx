/**
 * SlotSelector Component
 * Displays available time slots for selection
 */
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
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



export default function SlotSelector({ slots, date, onSelect, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!date) {
    return null;
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No hay horarios disponibles
        </h3>
        <p className="text-gray-600">
          No se encontraron horarios disponibles para la fecha seleccionada. 
          Por favor intente con otra fecha.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Horarios Disponibles para {formatDate(date)}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {slots.map((slot, index) => {
          const slotTime = slot.time || slot.start || '';
          return (
            <button
              key={index}
              onClick={() => onSelect(slot)}
              className="px-4 py-3 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium text-center"
            >
              <ClockIcon className="h-5 w-5 mx-auto mb-1" />
              {formatTime(slotTime)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

SlotSelector.propTypes = {
  slots: PropTypes.array.isRequired,
  date: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};