/**
 * LoadingSpinner Component
 * Reusable loading indicator
 * 
 * @module pages/public/shared/LoadingSpinner
 */

/**
 * Loading spinner with optional text
 * @param {Object} props - Component props
 * @param {string} props.text - Loading text to display
 * @param {string} props.size - Spinner size ('sm', 'md', 'lg')
 * @returns {JSX.Element}
 */
export default function LoadingSpinner({ text = 'Cargando...', size = 'md' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  return (
    <span className="flex items-center justify-center gap-2">
      <svg 
        className={`animate-spin ${sizeClasses[size]}`} 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4" 
          fill="none" 
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
        />
      </svg>
      {text && <span>{text}</span>}
    </span>
  );
}
