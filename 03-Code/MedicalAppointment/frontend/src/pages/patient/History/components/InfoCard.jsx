/**
 * Information card for displaying medical record data
 */
export function InfoCard({ icon, title, content, colorClass, iconColorClass, fullWidth = false }) {
  return (
    <div className={`${colorClass} ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${iconColorClass} flex-shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
            {content || <span className="text-gray-400 italic">No registrado</span>}
          </p>
        </div>
      </div>
    </div>
  );
}
