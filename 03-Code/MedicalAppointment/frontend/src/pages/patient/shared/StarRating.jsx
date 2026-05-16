/**
 * Star Rating Component
 * Interactive star rating input with optional label
 */
import { StarIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';

export default function StarRating({ 
  value = 0, 
  onChange, 
  label, 
  size = 'default',
  readonly = false 
}) {
  const sizeClasses = {
    small: 'w-5 h-5',
    default: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  const iconSize = sizeClasses[size];

  const handleClick = (star) => {
    if (!readonly && onChange) {
      onChange(star);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            disabled={readonly}
            className={`focus:outline-none transition-transform ${!readonly ? 'hover:scale-110' : ''}`}
          >
            {star <= value ? (
              <StarSolidIcon className={`${iconSize} text-yellow-400`} />
            ) : (
              <StarIcon className={`${iconSize} text-gray-300 ${!readonly ? 'hover:text-yellow-200' : ''}`} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

StarRating.propTypes = {
  value: PropTypes.number,                        
  onChange: PropTypes.func,                       
  label: PropTypes.string,                        
  size: PropTypes.oneOf(['small', 'default', 'large']), 
  readonly: PropTypes.bool,                       
};
