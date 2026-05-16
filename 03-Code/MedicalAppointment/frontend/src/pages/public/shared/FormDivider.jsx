/**
 * FormDivider Component
 * Visual divider with optional text
 * 
 * @module pages/public/shared/FormDivider
 */

/**
 * Horizontal divider with centered text
 * @param {Object} props - Component props
 * @param {string} props.text - Divider text
 * @returns {JSX.Element}
 */
import PropTypes from 'prop-types';

export default function FormDivider({ text = 'O' }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-gray-200" />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className="px-3 bg-white text-gray-500 font-medium">
          {text}
        </span>
      </div>
    </div>
  );
}
FormDivider.propTypes ={
text: PropTypes.string,
};