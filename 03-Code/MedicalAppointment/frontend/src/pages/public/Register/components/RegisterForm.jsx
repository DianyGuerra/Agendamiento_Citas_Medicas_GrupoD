/**
 * RegisterForm Component
 * Registration form with personal data inputs
 * 
 * @module pages/public/Register/components/RegisterForm
 */

import { Link } from 'react-router-dom';
import { 
  FormInput, 
  SubmitButton, 
  FormDivider, 
  AlertMessage,
  GoogleAuthButton 
} from '../../shared';

/**
 * Registration form component
 * @param {Object} props - Component props
 * @returns {JSX.Element}
 */
export default function RegisterForm({
  form,
  maxDob,
  onChange,
  onSubmit,
  onGoogleRegister,
  loading,
  error,
  success,
}) {
  return (
    <>
      <FormHeader />
      
      <form onSubmit={onSubmit} className="space-y-4">
        <NameFields form={form} onChange={onChange} />
        <IdentificationFields form={form} onChange={onChange} />
        <DateField form={form} maxDob={maxDob} onChange={onChange} />
        <EmailField form={form} onChange={onChange} />
        <PasswordFields form={form} onChange={onChange} />

        <AlertMessage type="error" message={error} />
        <AlertMessage type="success" message={success} />

        <SubmitButton 
          loading={loading} 
          text="Crear Cuenta" 
          loadingText="Registrando..."
          className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl"
        />

        <FormDivider text="O continúa con" />

        <GoogleAuthButton 
          onClick={onGoogleRegister} 
          text="Registrarse con Google" 
        />

        <LoginLink />
      </form>
    </>
  );
}

/**
 * Form header
 */
function FormHeader() {
  return (
    <div className="text-center mb-6 lg:mb-8">
      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        Crea tu cuenta
      </h1>
    </div>
  );
}

/**
 * Name input fields (first name, last name)
 */
function NameFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormInput
        type="text"
        name="first_name"
        value={form.first_name}
        onChange={onChange}
        placeholder="Nombre"
        required
        autoComplete="given-name"
      />
      <FormInput
        type="text"
        name="last_name"
        value={form.last_name}
        onChange={onChange}
        placeholder="Apellido"
        required
        autoComplete="family-name"
      />
    </div>
  );
}

/**
 * Identification fields (cedula, phone)
 */
function IdentificationFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormInput
        type="text"
        name="cedula"
        value={form.cedula}
        onChange={onChange}
        placeholder="Cédula"
        required
        maxLength="10"
        autoComplete="off"
      />
      <FormInput
        type="tel"
        name="phone_number"
        value={form.phone_number}
        onChange={onChange}
        placeholder="Teléfono"
        maxLength="10"
        autoComplete="tel"
      />
    </div>
  );
}

/**
 * Date of birth field
 */
function DateField({ form, maxDob, onChange }) {
  return (
    <FormInput
      type="date"
      name="date_of_birth"
      value={form.date_of_birth}
      onChange={onChange}
      max={maxDob}
      autoComplete="bday"
    />
  );
}

/**
 * Email field
 */
function EmailField({ form, onChange }) {
  return (
    <FormInput
      type="email"
      name="email"
      value={form.email}
      onChange={onChange}
      placeholder="Correo Electrónico"
      required
      autoComplete="email"
    />
  );
}

/**
 * Password input fields
 */
function PasswordFields({ form, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormInput
        type="password"
        name="password"
        value={form.password}
        onChange={onChange}
        placeholder="Contraseña"
        required
        autoComplete="new-password"
      />
      <FormInput
        type="password"
        name="confirm_password"
        value={form.confirm_password}
        onChange={onChange}
        placeholder="Confirmar"
        required
        autoComplete="new-password"
      />
    </div>
  );
}

/**
 * Login redirect link
 */
function LoginLink() {
  return (
    <p className="text-center text-gray-600 mt-6 text-sm">
      ¿Ya tienes una cuenta?{' '}
      <Link 
        to="/login" 
        className="text-primary-500 font-bold hover:underline transition-colors"
      >
        Inicia sesión aquí
      </Link>
    </p>
  );
}
