/**
 * Modal Component
 * Reusable modal dialog with header, body and footer
 */
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  icon: Icon,
  children, 
  footer,
  size = 'md',
  headerGradient = 'from-blue-600 to-blue-700'
}) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${headerGradient} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-white/20 rounded-lg">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h3 className="text-xl font-bold text-white">{title}</h3>
                {subtitle && <p className="text-white/80 text-sm">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex gap-3 p-4 bg-gray-50 rounded-b-2xl border-t">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
