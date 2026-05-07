/**
 * RemindersCard Component
 * Displays helpful reminders for the patient
 */
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DEFAULT_REMINDERS = [
  'Complete su perfil médico para un mejor servicio',
  'Recuerde llevar sus documentos a la próxima cita',
];

export default function RemindersCard({ reminders = DEFAULT_REMINDERS }) {
  return (
    <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm p-6 border border-yellow-200">
      <div className="flex items-center gap-3 mb-4">
        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
        <h2 className="text-lg font-bold text-gray-900">Recordatorios</h2>
      </div>
      <ul className="space-y-3">
        {reminders.map((reminder, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-yellow-600 font-bold">•</span>
            <span>{reminder}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
