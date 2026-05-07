/**
 * useLoginForm Hook
 * Handles login form logic and OAuth processing
 * 
 * @module pages/public/Login/hooks/useLoginForm
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';

/**
 * OAuth error messages mapping
 */
const OAUTH_ERROR_MESSAGES = {
  'google_auth_failed': 'Error al autenticar con Google. Intenta nuevamente.',
  'callback_failed': 'Error en el proceso de autenticación.',
  'authentication_failed': 'No se pudo completar la autenticación.',
};

/**
 * Role-based redirect routes
 */
const ROLE_ROUTES = {
  patient: '/patient/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
};

/**
 * Custom hook for login form management
 * @returns {Object} Form state and handlers
 */
export default function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  /**
   * Process OAuth callback from URL params
   */
  useEffect(() => {
    handleOAuthErrors();
    handleOAuthSuccess();
  }, [searchParams, navigate]);

  /**
   * Handle OAuth error params
   */
  const handleOAuthErrors = useCallback(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(OAUTH_ERROR_MESSAGES[oauthError] || 'Error desconocido');
    }
  }, [searchParams]);

  /**
   * Handle successful OAuth callback
   */
  const handleOAuthSuccess = useCallback(() => {
    const oauthParam = searchParams.get('oauth');
    if (!oauthParam) return;

    try {
      const payload = decodeOAuthPayload(oauthParam);
      saveAuthData(payload);
      
      const needsCompletion = searchParams.get('needs_completion') === 'true';
      const redirectPath = needsCompletion 
        ? '/complete-profile' 
        : ROLE_ROUTES[payload.user.role] || '/';
      
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Error procesando OAuth:', err);
      setError('Error al procesar la autenticación');
    }
  }, [searchParams, navigate]);

  /**
   * Decode base64 OAuth payload
   * @param {string} encoded - Base64 encoded payload
   * @returns {Object} Decoded payload
   */
  const decodeOAuthPayload = (encoded) => {
    const binaryString = atob(encoded);
    const bytes = new Uint8Array(binaryString.length);
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const decoder = new TextDecoder('utf-8');
    const jsonPayload = decoder.decode(bytes);
    return JSON.parse(jsonPayload);
  };

  /**
   * Save auth data to localStorage
   * @param {Object} payload - Auth payload with token and user
   */
  const saveAuthData = (payload) => {
    localStorage.setItem('token', payload.token);
    localStorage.setItem('user', JSON.stringify(payload.user));
  };

  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        const route = ROLE_ROUTES[result.user.role] || '/';
        navigate(route, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth login
   */
  const handleGoogleLogin = () => {
    const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL || 
      'https://medical-external-api.onrender.com/api/v1';
    const baseUrl = EXTERNAL_API_URL.replace('/api/v1', '');
    window.location.href = `${baseUrl}/api/v1/auth/google`;
  };

  return {
    // Form state
    email,
    password,
    error,
    loading,
    // Setters
    setEmail,
    setPassword,
    // Handlers
    handleSubmit,
    handleGoogleLogin,
  };
}
