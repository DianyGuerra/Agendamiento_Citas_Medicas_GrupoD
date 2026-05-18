/**
 * SubmitButton Component
 * Primary submit button for forms
 * 
 * @module pages/public/shared/SubmitButton
 */

import LoadingSpinner from './LoadingSpinner';
import PropTypes from 'prop-types';

/**
 * Styled submit button with loading state
 * @param {Object} props - Component props
 * @param {boolean} props.loading - Loading state
 * @param {string} props.text - Button text
 * @param {string} props.loadingText - Text while loading
 * @param {string} props.className - Additional classes
 * @returns {JSX.Element}
 */
export default function SubmitButton({
  loading = false,
  text = 'Enviar',
  loadingText = 'Cargando...',
  className = '',
  ...props
}) {
  const baseStyles = `
    w-full py-4 rounded-full 
    text-lg font-semibold uppercase tracking-wide 
    bg-gradient-to-r from-green-500 to-green-600 text-white
    hover:from-green-600 hover:to-green-700 
    hover:-translate-y-1 hover:shadow-xl 
    transition-all
    disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none
  `;

  return (
    <button
      type="submit"
      disabled={loading}
      className={`${baseStyles} ${className}`}
      {...props}
    >
      {loading ? <LoadingSpinner text={loadingText} /> : text}
    </button>
  );
}

SubmitButton.propTypes = {
  loading: PropTypes.bool,                  
  text: PropTypes.string,                   
  loadingText: PropTypes.string,            
  className: PropTypes.string,              
};
