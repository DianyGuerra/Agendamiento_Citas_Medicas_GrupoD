import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import PropTypes from 'prop-types';
/**
 * Star rating input component
 */
export function StarRating({ value, onChange, label, size = 'normal' }) {
  const iconClass = size === 'large' ? 'w-12 h-12' : 'w-8 h-8';

  return (
    <div className="flex items-center gap-4">
      {label && <span className="text-sm text-gray-600 w-32">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 hover:scale-110 transition"
          >
            {star <= value ? (
              <StarSolidIcon className={`${iconClass} text-yellow-400`} />
            ) : (
              <StarIcon className={`${iconClass} text-gray-300 hover:text-yellow-300`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
StarRating.propTypes = {
  value: PropTypes.number.isRequired,       
  onChange: PropTypes.func.isRequired,      
  label: PropTypes.string,                  
  size: PropTypes.oneOf(['normal', 'large']), 
};
