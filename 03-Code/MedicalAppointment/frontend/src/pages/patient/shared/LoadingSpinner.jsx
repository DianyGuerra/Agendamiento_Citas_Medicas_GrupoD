/**
 * Loading Spinner Component
 * Displays a centered loading animation with optional message
 */
import PropTypes from 'prop-types';
export default function LoadingSpinner({ message = 'Cargando...', size = 'default' }) {
  const sizeClasses = {
    small: 'h-8 w-8',
    default: 'h-12 w-12',
    large: 'h-16 w-16',
  };

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div
          className={`animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4 ${sizeClasses[size]}`}
        />
        {message && <p className="text-gray-600">{message}</p>}
      </div>
    </div>
  );
}

LoadingSpinner.propTypes = {
  message: PropTypes.string,                         
  size: PropTypes.oneOf(['small', 'default', 'large']), 
};
