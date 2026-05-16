/**
 * Tab Navigation Component
 * Horizontal tab navigation with active state
 */
import PropTypes from 'prop-types';
export default function TabNavigation({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="flex space-x-8 px-6" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm 
                transition-colors flex items-center gap-2
                ${isActive
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {tab.label}
              {tab.count !== undefined && (
                <span className={`
                  px-2 py-0.5 rounded-full text-xs
                  ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

TabNavigation.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,        
      label: PropTypes.string.isRequired,     
      icon: PropTypes.elementType,            
      count: PropTypes.number,                
    })
  ).isRequired,
  activeTab: PropTypes.string.isRequired,     
  onChange: PropTypes.func.isRequired,        
  className: PropTypes.string,                
};
