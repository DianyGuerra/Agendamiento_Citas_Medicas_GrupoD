/**
 * AuthCallback Page
 * Handles OAuth callback from Google
 * Extracts token and user from URL and stores in localStorage
 */

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../config/constants';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const token = searchParams.get('token');
        const userParam = searchParams.get('user');
        const errorParam = searchParams.get('error');
        const errorMessage = searchParams.get('message');

        if (errorParam) {
          setError(errorMessage || 'Error de autenticación con Google');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (!token || !userParam) {
          setError('No se recibieron credenciales válidas');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        // Parse user data
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store in localStorage
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));

        // Update auth context
        if (setUser) {
          setUser(user);
        }

        // Redirect based on role
        const redirectPath = getRedirectPath(user.role);
        navigate(redirectPath, { replace: true });

      } catch (err) {
        console.error('Auth callback error:', err);
        setError('Error procesando la autenticación');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  const getRedirectPath = (role) => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'doctor':
        return '/doctor/dashboard';
      case 'patient':
      default:
        return '/patient/dashboard';
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Error de Autenticación</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Autenticando...</h1>
        <p className="text-gray-600">Por favor espera mientras procesamos tu inicio de sesión.</p>
      </div>
    </div>
  );
}
