/**
 * Status Badge Component
 * Displays a colored badge with icon for status indication
 */
export default function StatusBadge({ 
  status, 
  config = {}, 
  icon: Icon = null, 
  className = '' 
}) {
  const { label, color } = config;
  
  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${color} ${className}`}>
      {Icon && <Icon className="h-4 w-4" />}
      {label || status}
    </span>
  );
}
