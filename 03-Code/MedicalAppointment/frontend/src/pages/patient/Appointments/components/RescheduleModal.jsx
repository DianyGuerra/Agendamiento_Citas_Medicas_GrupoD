/**
 * RescheduleModal Component
 * Modal for rescheduling an appointment with date and slot selection
 */
import { useState, useEffect } from 'react';
import { XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function RescheduleModal({ appointment, onConfirm, onClose, loadAvailableSlots }) {
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (rescheduleDate && appointment) {
      loadSlots();
    }
  }, [rescheduleDate]);

  const loadSlots = async () => {
    setLoadingSlots(true);
    const slots = await loadAvailableSlots(appointment.doctor_id, rescheduleDate);
    setAvailableSlots(slots);
    setLoadingSlots(false);
  };

  const handleConfirm = () => {
    if (!selectedSlot) return;

    const slotTime = selectedSlot.time || selectedSlot.start;
    const timeString = slotTime.length === 5 ? `${slotTime}:00` : slotTime;
    const localDateTime = `${rescheduleDate}T${timeString}`;
    const date = new Date(localDateTime);
    const newScheduledStart = date.toISOString();

    onConfirm(newScheduledStart);
  };

  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Reagendar Cita</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-gray-700">
            <strong>Cita actual:</strong> Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
          </p>
          <p className="text-sm text-gray-700">
            <strong>Fecha actual:</strong>{' '}
            {new Date(appointment.scheduled_start).toLocaleString('es-EC', {
              dateStyle: 'full',
              timeStyle: 'short',
            })}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <span className="block text-sm font-semibold text-gray-700 mb-2">
              Seleccione una nueva fecha
            </span>
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => {
                setRescheduleDate(e.target.value);
                setSelectedSlot(null);
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {rescheduleDate && (
            <div>
              <span className="block text-sm font-semibold text-gray-700 mb-2">
                Horarios Disponibles
              </span>
              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-4">Cargando horarios...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No hay horarios disponibles para esta fecha</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2">
                  {availableSlots.map((slot, index) => {
                    const slotTime = slot.time || slot.start || '';
                    const isSelected = selectedSlot && (selectedSlot.time === slotTime || selectedSlot.start === slotTime);
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {slotTime.substring(0, 5)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedSlot}
            className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
              selectedSlot
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmar Reagendamiento
          </button>
        </div>
      </div>
    </div>
  );
}
