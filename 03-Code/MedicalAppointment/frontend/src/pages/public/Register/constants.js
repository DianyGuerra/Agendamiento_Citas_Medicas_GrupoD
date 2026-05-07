/**
 * Register Form Constants
 * Initial values and validation rules
 * 
 * @module pages/public/Register/constants
 */

/**
 * Initial form state
 */
export const INITIAL_FORM_STATE = {
  first_name: '',
  last_name: '',
  cedula: '',
  date_of_birth: '',
  phone_number: '',
  email: '',
  password: '',
  confirm_password: '',
  role: 'patient',
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  CEDULA_LENGTH: 10,
  PHONE_LENGTH: 10,
  MIN_AGE_YEARS: 18,
};

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELDS: 'Por favor completa todos los campos obligatorios',
  PASSWORDS_NOT_MATCH: 'Las contraseñas no coinciden',
  INVALID_CEDULA: 'La cédula debe tener 10 dígitos numéricos',
  INVALID_PHONE: 'El teléfono debe tener 10 dígitos numéricos',
};
