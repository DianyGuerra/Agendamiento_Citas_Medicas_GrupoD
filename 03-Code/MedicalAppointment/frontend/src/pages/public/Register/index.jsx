/**
 * Register Page
 * New user registration page
 * 
 * @module pages/public/Register
 */

import { AuthLayout } from '../shared';
import { RegisterForm } from './components';
import { useRegisterForm } from './hooks';

/**
 * Register page component
 * @returns {JSX.Element}
 */
export default function Register() {
  const {
    form,
    loading,
    error,
    success,
    maxDob,
    handleChange,
    handleSubmit,
    handleGoogleRegister,
  } = useRegisterForm();

  return (
    <AuthLayout 
      brandingTitle="¡Únete a nosotros!" 
      brandingSubtitle="Tu salud es nuestra prioridad"
    >
      <RegisterForm
        form={form}
        maxDob={maxDob}
        onChange={handleChange}
        onSubmit={handleSubmit}
        onGoogleRegister={handleGoogleRegister}
        loading={loading}
        error={error}
        success={success}
      />
    </AuthLayout>
  );
}
