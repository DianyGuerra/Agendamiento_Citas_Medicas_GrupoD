/**
 * Empty State Component
 * Displays when there's no data to show
 */
import { Link } from 'react-router-dom';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action = null,
  className = '' 
}) {
  const renderAction = () => {
    if (!action) return null;

    if (typeof action === 'object' && !action.$$typeof) {
      const ActionIcon = action.icon;
      const content = (
        <>
          {ActionIcon && <ActionIcon className="h-5 w-5" />}
          <span>{action.label}</span>
        </>
      );

      if (action.to) {
        return (
          <Link
            to={action.to}
            className={action.className || 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors'}
          >
            {content}
          </Link>
        );
      }

      if (action.onClick) {
        return (
          <button
            type="button"
            onClick={action.onClick}
            className={action.className || 'inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors'}
          >
            {content}
          </button>
        );
      }
    }

    return action;
  };

  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {renderAction()}
    </div>
  );
}
