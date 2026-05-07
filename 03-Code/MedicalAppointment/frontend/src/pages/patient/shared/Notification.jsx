/**
 * Notification Toast Component
 * Displays temporary notification messages
 */
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const NOTIFICATION_CONFIG = {
  success: {
    bg: 'bg-green-500',
    icon: CheckCircleIcon,
  },
  error: {
    bg: 'bg-red-500',
    icon: XCircleIcon,
  },
  warning: {
    bg: 'bg-yellow-500',
    icon: ExclamationCircleIcon,
  },
  info: {
    bg: 'bg-blue-500',
    icon: ExclamationCircleIcon,
  },
};

export default function Notification({ notification, onClose }) {
  if (!notification) return null;

  const { message, type = 'info', action } = notification;
  const config = NOTIFICATION_CONFIG[type] || NOTIFICATION_CONFIG.info;
  const Icon = config.icon;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-md">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${config.bg} text-white`}>
        <Icon className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1">
          <span className="font-medium">{message}</span>
          {action && (
            <button
              onClick={() => {
                action.onClick();
                onClose?.();
              }}
              className="ml-2 underline hover:no-underline font-semibold"
            >
              {action.label}
            </button>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-2 hover:bg-white/20 rounded p-1 flex-shrink-0"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Hook for using notifications
export function useNotification() {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'info', action = null) => {
    setNotification({ message, type, action });
    setTimeout(() => setNotification(null), 5000);
  };

  const clearNotification = () => setNotification(null);

  return { notification, showNotification, clearNotification };
}

import { useState } from 'react';
