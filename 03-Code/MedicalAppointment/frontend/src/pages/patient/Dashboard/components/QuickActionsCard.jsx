/**
 * QuickActionsCard Component
 * Displays quick action buttons for common tasks
 */
import { Link } from 'react-router-dom';
import {
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const QUICK_ACTIONS = [
  {
    to: '/patient/new-appointment',
    label: 'Agendar Cita',
    icon: CalendarIcon,
    gradient: 'from-blue-50 to-blue-100',
    hoverGradient: 'hover:from-blue-100 hover:to-blue-200',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-600',
  },
  {
    to: '/patient/prescriptions',
    label: 'Ver Recetas',
    icon: DocumentTextIcon,
    gradient: 'from-purple-50 to-purple-100',
    hoverGradient: 'hover:from-purple-100 hover:to-purple-200',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-600',
  },
  {
    to: '/patient/lab',
    label: 'Resultados Lab',
    icon: BeakerIcon,
    gradient: 'from-yellow-50 to-yellow-100',
    hoverGradient: 'hover:from-yellow-100 hover:to-yellow-200',
    borderColor: 'border-yellow-200',
    iconBg: 'bg-yellow-600',
  },
  {
    to: '/patient/history',
    label: 'Historial Médico',
    icon: ClockIcon,
    gradient: 'from-green-50 to-green-100',
    hoverGradient: 'hover:from-green-100 hover:to-green-200',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-600',
  },
];

export default function QuickActionsCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className={`flex flex-col items-center justify-center p-6 bg-gradient-to-br ${action.gradient} rounded-xl ${action.hoverGradient} transition-all border ${action.borderColor} group`}
            >
              <div className={`${action.iconBg} p-4 rounded-full mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="h-8 w-8 text-white" />
              </div>
              <span className="font-bold text-gray-900">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
