import { UserIcon } from '@heroicons/react/24/outline';

/**
 * Appointment info header for rating page
 */
import PropTypes from 'prop-types';

export function AppointmentInfo({ appointment, formatDate }) {
  if (!appointment) return null;

  return (
    <div className="p-6 bg-gray-50 border-b">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
          <UserIcon className="w-8 h-8 text-blue-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-800">
            Dr(a). {appointment.doctor?.user?.first_name} {appointment.doctor?.user?.last_name}
          </p>
          <p className="text-sm text-gray-500">
            {appointment.doctor?.specialty?.name || 'Especialidad'}
          </p>
          <p className="text-sm text-gray-500">{formatDate(appointment.scheduled_start)}</p>
        </div>
      </div>
    </div>
  );
}

AppointmentInfo.propTypes = {
  appointment: PropTypes.object.isRequired,   
  formatDate: PropTypes.func.isRequired,      
};
