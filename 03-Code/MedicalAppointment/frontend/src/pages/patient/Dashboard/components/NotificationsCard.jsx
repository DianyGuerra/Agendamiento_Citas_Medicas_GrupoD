/**
 * NotificationsCard Component
 * Displays recent unread notifications
 */
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const NOTIFICATION_COLORS = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  red: 'bg-red-100 text-red-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  purple: 'bg-purple-100 text-purple-600',
  orange: 'bg-orange-100 text-orange-600',
  gray: 'bg-gray-100 text-gray-600',
};

export default function NotificationsCard({ notifications }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
        <Link to="/patient/notifications" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Ver todas →
        </Link>
      </div>
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            const iconColor = NOTIFICATION_COLORS[notification.color] || NOTIFICATION_COLORS.gray;
            
            return (
              <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-full flex-shrink-0 ${iconColor}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                  <p className="text-gray-600 text-xs truncate">{notification.message}</p>
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(notification.timestamp).toLocaleDateString('es-EC', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="bg-green-100 rounded-full p-4 inline-flex mb-3">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-gray-600">No tienes notificaciones pendientes</p>
          </div>
        </div>
      )}
    </div>
  );
}
NotificationsCard.propTypes = {
  notifications: PropTypes.array.isRequired,
};
