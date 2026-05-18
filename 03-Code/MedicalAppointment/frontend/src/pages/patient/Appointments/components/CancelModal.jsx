/**
 * CancelModal Component
 * Confirmation modal for cancelling an appointment
 */
import { Modal } from '../../shared';
import PropTypes from 'prop-types';

export default function CancelModal({ appointment, onConfirm, onClose }) {
  if (!appointment) return null;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Confirmar Cancelación"
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-4 w-full">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            No, mantener
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Sí, cancelar
          </button>
        </div>
      }
    >
      <p className="text-gray-600">
        ¿Está seguro que desea cancelar la cita con{' '}
        <strong>
          Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
        </strong>{' '}
        ?
      </p>
    </Modal>
  );
}


CancelModal.propTypes = {
  appointment: PropTypes.object.isRequired, // genérico
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};