/**
 * Login Page
 * User authentication page
 * 
 * @module pages/public/Login
 */

import { AuthLayout } from '../shared';
import { LoginForm } from './components';
import { useLoginForm } from './hooks';

/**
 * Login page component
 * @returns {JSX.Element}
 */
export default function Login() {
  const {
    email,
    password,
    error,
    loading,
    setEmail,
    setPassword,
    handleSubmit,
    handleGoogleLogin,
  } = useLoginForm();

  return (
    <AuthLayout 
      brandingTitle="¡Bienvenido!" 
      brandingSubtitle="Tu salud es nuestra prioridad"
    >
      <LoginForm
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        onSubmit={handleSubmit}
        onGoogleLogin={handleGoogleLogin}
        loading={loading}
        error={error}
      />
    </AuthLayout>
  );
}
