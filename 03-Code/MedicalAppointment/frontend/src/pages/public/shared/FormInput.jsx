/**
 * FormInput Component
 * Reusable styled input for forms
 * 
 * @module pages/public/shared/FormInput
 */

/**
 * Styled form input
 * @param {Object} props - Component props
 * @param {string} props.type - Input type
 * @param {string} props.name - Input name
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.required - Is required
 * @param {string} props.className - Additional classes
 * @returns {JSX.Element}
 */
import PropTypes from 'prop-types';

export default function FormInput({
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  ...props
}) {
  const baseStyles = `
    w-full px-5 py-4 
    border-2 border-gray-200 rounded-2xl 
    text-base bg-gray-50 text-gray-800 
    placeholder-gray-400 
    focus:outline-none focus:border-primary-500 
    focus:bg-white focus:shadow-lg 
    transition-all
  `;

  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`${baseStyles} ${className}`}
      {...props}
    />
  );
}

FormInput.propTypes = {
  type: PropTypes.string,                  
  name: PropTypes.string,       
  value: PropTypes.oneOfType([             
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  onChange: PropTypes.func.isRequired,     
  placeholder: PropTypes.string,           
  required: PropTypes.bool,                
  className: PropTypes.string,             
};
