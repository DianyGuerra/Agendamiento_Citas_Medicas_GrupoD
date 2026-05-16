/**
 * Page Header Component
 * Gradient header with title, description and optional actions
 */
import PropTypes from 'prop-types';

export default function PageHeader({ 
  icon: Icon, 
  title, 
  description, 
  children,
  gradient = 'from-blue-600 to-blue-700' 
}) {
  return (
    <div className={`bg-gradient-to-r ${gradient} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="bg-white/20 p-4 rounded-xl">
              <Icon className="h-8 w-8" />
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            {description && <p className="mt-1 opacity-90">{description}</p>}
          </div>
        </div>
        {children && <div className="flex flex-wrap gap-3">{children}</div>}
      </div>
    </div>
  );
}

PageHeader.propTypes = {
  icon: PropTypes.elementType,                
  title: PropTypes.string.isRequired,         
  description: PropTypes.string,              
  children: PropTypes.node,                   
  gradient: PropTypes.string,               
};
