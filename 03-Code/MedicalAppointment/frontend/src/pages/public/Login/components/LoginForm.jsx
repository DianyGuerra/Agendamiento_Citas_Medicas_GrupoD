/**
 * LoginForm Component
 * Main login form with email/password inputs
 * 
 * @module pages/public/Login/components/LoginForm
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
 * Login form component
 * @param {Object} props - Component props
 * @param {string} props.email - Email value
 * @param {string} props.password - Password value
 * @param {Function} props.setEmail - Email setter
 * @param {Function} props.setPassword - Password setter
 * @param {Function} props.onSubmit - Form submit handler
 * @param {Function} props.onGoogleLogin - Google login handler
 * @param {boolean} props.loading - Loading state
 * @param {string} props.error - Error message
 * @returns {JSX.Element}
 */
export default function LoginForm({
  email,
  password,
  setEmail,
  setPassword,
  onSubmit,
  onGoogleLogin,
  loading,
  error,
}) {
  return (
    <>
      <FormHeader />
      
      <form onSubmit={onSubmit} className="space-y-6">
        <FormInput
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo Electrónico"
          required
          autoComplete="email"
        />

        <FormInput
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          autoComplete="current-password"
        />

        <ForgotPasswordLink />

        <AlertMessage type="error" message={error} />

        <SubmitButton 
          loading={loading} 
          text="Ingresar" 
          loadingText="Cargando..." 
        />

        <FormDivider />

        <GoogleAuthButton onClick={onGoogleLogin} />

        <RegisterLink />
      </form>
    </>
  );
}

/**
 * Form header with title
 */
function FormHeader() {
  return (
    <div className="text-center mb-8 lg:mb-10">
      <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
        Accede a tu cuenta
      </h1>
    </div>
  );
}

/**
 * Forgot password link
 */
function ForgotPasswordLink() {
  return (
    <div className="text-right">
      <Link 
        to="/forgot-password" 
        className="text-sm text-primary-500 hover:text-primary-600 hover:underline transition-colors"
      >
        ¿Olvidaste tu contraseña?
      </Link>
    </div>
  );
}

/**
 * Register redirect link
 */
function RegisterLink() {
  return (
    <div className="text-center mt-4">
      <p className="text-gray-600 text-sm">
        ¿No tienes una cuenta?{' '}
        <Link 
          to="/register" 
          className="text-primary-500 font-semibold hover:text-primary-600 hover:underline transition-colors"
        >
          Regístrate aquí
        </Link>
      </p>
    </div>
  );
}
