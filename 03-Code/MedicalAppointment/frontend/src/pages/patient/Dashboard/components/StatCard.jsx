/**
 * StatCard Component
 * Displays a statistic card with icon, value and link
 */
import { Link } from 'react-router-dom';

export default function StatCard({ title, value, icon: Icon, color, bgColor, link }) {
  return (
    <Link
      to={link}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-200 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-4xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-full`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </Link>
  );
}
