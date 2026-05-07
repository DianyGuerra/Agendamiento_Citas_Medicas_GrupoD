/**
 * HealthSummaryCard Component
 * Displays patient health summary information
 */
import { HeartIcon } from '@heroicons/react/24/outline';

const HEALTH_ITEMS = [
  { key: 'blood_type', label: 'Tipo de Sangre', fallback: 'No registrado' },
  { key: 'allergies', label: 'Alergias', fallback: 'Ninguna registrada' },
  { key: 'conditions', label: 'Condiciones', fallback: 'Ninguna registrada' },
  { key: 'medications', label: 'Medicamentos', fallback: 'Ninguno registrado' },
  { key: 'lastVisit', label: 'Última Consulta', fallback: 'Sin consultas' },
];

export default function HealthSummaryCard({ healthSummary, stats }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-red-100 p-2 rounded-lg">
          <HeartIcon className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Resumen de Salud</h2>
      </div>
      <div className="space-y-3">
        {HEALTH_ITEMS.map((item) => {
          const value = healthSummary?.[item.key];
          return (
            <div key={item.key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">{item.label}</span>
              <span className={`font-bold ${value ? 'text-gray-900' : 'text-gray-400'}`}>
                {value || item.fallback}
              </span>
            </div>
          );
        })}
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Citas Completadas</span>
          <span className="font-bold text-gray-900">{stats?.completedAppointments || 0}</span>
        </div>
        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">Citas Próximas</span>
          <span className="font-bold text-gray-900">{stats?.upcomingAppointments || 0}</span>
        </div>
      </div>
    </div>
  );
}
