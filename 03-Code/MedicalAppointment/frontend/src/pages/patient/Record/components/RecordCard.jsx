/**
 * Card for displaying medical record information
 */
import PropTypes from 'prop-types';
export function RecordCard({ icon, iconBgClass, title, children }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className={`${iconBgClass} p-3 rounded-lg`}>{icon}</div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

RecordCard.propTypes = {
  icon: PropTypes.node.isRequired,          
  iconBgClass: PropTypes.string.isRequired, 
  title: PropTypes.string.isRequired,       
  children: PropTypes.node.isRequired,      
};
