/**
 * useRegisterForm Hook
 * Handles registration form logic and validation
 * 
 * @module pages/public/Register/hooks/useRegisterForm
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { externalApi } from '../../../../services/httpClient';
import { 
  INITIAL_FORM_STATE, 
  VALIDATION_RULES, 
  VALIDATION_MESSAGES 
} from '../constants';

/**
 * Custom hook for register form management
 * @returns {Object} Form state and handlers
 */
export default function useRegisterForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maxDob, setMaxDob] = useState('');

  /**
   * Calculate max date of birth (18 years ago)
   */
  useEffect(() => {
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - VALIDATION_RULES.MIN_AGE_YEARS,
      today.getMonth(),
      today.getDate()
    );
    setMaxDob(maxDate.toISOString().split('T')[0]);
  }, []);

  /**
   * Handle input change
   * @param {Event} e - Input event
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  }, []);

  /**
   * Validate form data
   * @returns {boolean} Is valid
   */
  const validate = useCallback(() => {
    const { first_name, last_name, email, password, confirm_password, cedula, phone_number } = form;

    // Required fields
    if (!first_name || !last_name || !email || !password || !confirm_password) {
      setError(VALIDATION_MESSAGES.REQUIRED_FIELDS);
      return false;
    }

    // Password match
    if (password !== confirm_password) {
      setError(VALIDATION_MESSAGES.PASSWORDS_NOT_MATCH);
      return false;
    }

    // Cedula validation
    const cedulaRegex = new RegExp(`^[0-9]{${VALIDATION_RULES.CEDULA_LENGTH}}$`);
    if (!cedulaRegex.test(cedula)) {
      setError(VALIDATION_MESSAGES.INVALID_CEDULA);
      return false;
    }

    // Phone validation (optional but must be valid if provided)
    if (phone_number) {
      const phoneRegex = new RegExp(`^[0-9]{${VALIDATION_RULES.PHONE_LENGTH}}$`);
      if (!phoneRegex.test(phone_number)) {
        setError(VALIDATION_MESSAGES.INVALID_PHONE);
        return false;
      }
    }

    return true;
  }, [form]);

  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setLoading(true);

    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        cedula: form.cedula,
        date_of_birth: form.date_of_birth || null,
        phone_number: form.phone_number || null,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      await externalApi.post('/auth/register', payload);

      setSuccess('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setForm(INITIAL_FORM_STATE);
      
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Error al registrar el paciente');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google OAuth registration
   */
  const handleGoogleRegister = () => {
    const EXTERNAL_API_URL = import.meta.env.VITE_EXTERNAL_API_URL || 
      'https://medical-external-api.onrender.com/api/v1';
    const baseUrl = EXTERNAL_API_URL.replace('/api/v1', '');
    window.location.href = `${baseUrl}/api/v1/auth/google`;
  };

  return {
    form,
    loading,
    error,
    success,
    maxDob,
    handleChange,
    handleSubmit,
    handleGoogleRegister,
  };
}
