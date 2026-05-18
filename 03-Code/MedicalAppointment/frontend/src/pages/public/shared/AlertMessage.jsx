/**
 * AlertMessage Component
 * Displays error or success messages
 * 
 * @module pages/public/shared/AlertMessage
 */

/**
 * Alert message component
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type ('error' | 'success')
 * @param {string} props.message - Message to display
 * @returns {JSX.Element|null}
 */
import PropTypes from 'prop-types';
export default function AlertMessage({ type = 'error', message }) {
  if (!message) return null;

  const styles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
    <div 
      className={`border px-4 py-3 rounded-lg text-sm ${styles[type]}`}
      role="alert"
    >
      {message}
    </div>
  );
}

AlertMessage.propTypes = {
  type: PropTypes.oneOf(['error', 'success']),  
  message: PropTypes.string,                    
};
