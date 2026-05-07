/**
 * RecentHistoryCard Component
 * Displays recent medical history entries
 */
import { Link } from 'react-router-dom';
import { ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function RecentHistoryCard({ history }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Historial Reciente</h2>
        <Link to="/patient/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Ver →
        </Link>
      </div>
      {history.length > 0 ? (
        <div className="space-y-3">
          {history.map((record, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
            >
              <div className="bg-blue-100 p-2 rounded-lg">
                <ClockIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {new Date(record.date).toLocaleDateString('es-EC', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="font-semibold text-gray-900">{record.diagnosis || 'Consulta General'}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Dr. {record.doctor?.first_name} - {record.specialty?.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">No hay historial disponible</p>
        </div>
      )}
    </div>
  );
}
