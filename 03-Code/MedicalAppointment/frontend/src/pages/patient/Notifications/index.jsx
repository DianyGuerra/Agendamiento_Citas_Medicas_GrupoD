/**
 * PatientNotifications Page
 * Displays all notifications for the patient
 */
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import PatientLayout from '../../../layouts/PatientLayout';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { LoadingSpinner, NOTIFICATION_TYPES } from '../shared';
import { useNotifications, getTimeAgo } from '../shared/hooks';

const TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'unread', label: 'Sin leer' },
  { id: 'appointments', label: 'Citas' },
  { id: 'prescriptions', label: 'Recetas' },
  { id: 'lab', label: 'Laboratorio' },
  { id: 'billing', label: 'Facturas' },
  { id: 'system', label: 'Sistema' },
];

export default function PatientNotifications() {
  const { user } = useAuth();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isRead,
  } = useNotifications(user?.patientId || user?.id);

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Update unread count in localStorage for layout badge
  useEffect(() => {
    localStorage.setItem('patient_unread_notifications_count', unreadCount.toString());
    window.dispatchEvent(new CustomEvent('patientNotificationCountUpdate', { detail: { count: unreadCount } }));
  }, [unreadCount]);

  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter(n => !isRead(n.id));
      case 'appointments':
        return notifications.filter(n => 
          n.type.startsWith('appointment_') || n.type === 'prescription_ready'
        );
      case 'prescriptions':
        return notifications.filter(n => 
          n.type.startsWith('renewal_') || n.type === 'prescription_ready'
        );
      case 'lab':
        return notifications.filter(n => n.type.startsWith('lab_'));
      case 'billing':
        return notifications.filter(n => n.type.startsWith('billing_'));
      case 'system':
        return notifications.filter(n => n.type === 'announcement' || n.type === 'system');
      default:
        return notifications;
    }
  }, [notifications, activeTab, isRead]);

  const tabCounts = useMemo(() => ({
    all: notifications.length,
    unread: unreadCount,
    appointments: notifications.filter(n => n.type.startsWith('appointment_')).length,
    prescriptions: notifications.filter(n => n.type.startsWith('renewal_') || n.type === 'prescription_ready').length,
    lab: notifications.filter(n => n.type.startsWith('lab_')).length,
    billing: notifications.filter(n => n.type.startsWith('billing_')).length,
    system: notifications.filter(n => n.type === 'announcement' || n.type === 'system').length,
  }), [notifications, unreadCount]);

  if (loading) {
    return (
      <PatientLayout>
        <LoadingSpinner message="Cargando notificaciones..." />
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BellSolidIcon className="h-8 w-8 text-primary-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0 
                  ? `${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                  : 'Todas las notificaciones leídas'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadNotifications}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
              title="Actualizar"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition"
              >
                <CheckIcon className="h-4 w-4" />
                Marcar todas como leídas
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={loadNotifications}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="flex gap-4 overflow-x-auto" aria-label="Tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs
                    ${activeTab === tab.id 
                      ? 'bg-primary-100 text-primary-600' 
                      : 'bg-gray-100 text-gray-600'}
                  `}>
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No hay notificaciones</h3>
              <p className="text-gray-500 mt-1">
                {activeTab === 'unread' 
                  ? 'Has leído todas tus notificaciones'
                  : 'Las notificaciones aparecerán aquí'}
              </p>
            </div>
          ) : (
            filteredNotifications.map(notification => {
              const config = NOTIFICATION_TYPES[notification.type] || NOTIFICATION_TYPES.system;
              const notificationIsRead = isRead(notification.id);

              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markAsRead(notification.id)}
                  aria-label="Marcar notificación como leída"
                  className={`
                    relative flex items-start gap-4 p-4 rounded-lg border cursor-pointer
                    transition-all duration-200
                    ${notificationIsRead 
                      ? 'bg-white border-gray-200 hover:bg-gray-50' 
                      : 'bg-primary-50 border-primary-200 hover:bg-primary-100'}
                  `}
                >
                  {/* Unread indicator */}
                  {!notificationIsRead && (
                    <div className="absolute top-4 left-0 w-1 h-8 bg-primary-500 rounded-r-full" />
                  )}

                  {/* Icon */}
                  <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor}`}>
                    <BellIcon className={`h-5 w-5 ${config.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.iconColor} font-medium mb-1`}>
                          {config.label}
                        </span>
                        <h3 className={`font-medium ${notificationIsRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {getTimeAgo(notification.date)}
                      </span>
                    </div>
                    <p className={`mt-1 text-sm ${notificationIsRead ? 'text-gray-500' : 'text-gray-700'}`}>
                      {notification.message}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {!notificationIsRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-white rounded transition"
                        title="Marcar como leída"
                      >
                        <CheckIcon className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded transition"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        {notifications.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Mostrando {filteredNotifications.length} de {notifications.length} notificaciones
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
