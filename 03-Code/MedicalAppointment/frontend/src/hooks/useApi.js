/**
 * useApi Hook
 * Generic hook for API calls with loading and error states
 * 
 * @module hooks/useApi
 */

import { useState, useCallback } from 'react';

/**
 * Custom hook for handling API calls
 * @returns {Object} API call utilities
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Execute an API call
   * @param {Function} apiCall - API function to execute
   * @param {Object} options - Options
   * @returns {Promise<any>}
   */
  const execute = useCallback(async (apiCall, options = {}) => {
    const { onSuccess, onError, showError = true } = options;

    try {
      setLoading(true);
      setError(null);
      
      const result = await apiCall();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Ha ocurrido un error';
      
      if (showError) {
        setError(errorMessage);
      }
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

export default useApi;
