/**
 * Empty State Component
 * Displays when there's no data to show
 */
export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action = null,
  className = '' 
}) {
  return (
    <div className={`text-center py-12 ${className}`}>
      {Icon && <Icon className="h-16 w-16 text-gray-300 mx-auto mb-4" />}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && <p className="text-gray-600 mb-6">{description}</p>}
      {action}
    </div>
  );
}
