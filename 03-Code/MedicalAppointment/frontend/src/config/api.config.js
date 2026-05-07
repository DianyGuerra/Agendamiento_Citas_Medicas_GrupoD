/**
 * API Configuration
 * Configuration for the 3 independent API services
 * 
 * @module config/api.config
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;

// API Base URLs
const API_URLS = {
  crud: isDevelopment 
    ? 'http://localhost:3001/api/v1'
    : import.meta.env.VITE_CRUD_API_URL || 'https://medical-crud-api.onrender.com/api/v1',
  
  business: isDevelopment 
    ? 'http://localhost:3002/api/v1'
    : import.meta.env.VITE_BUSINESS_API_URL || 'https://medical-business-api.onrender.com/api/v1',
  
  external: isDevelopment 
    ? 'http://localhost:3003/api/v1'
    : import.meta.env.VITE_EXTERNAL_API_URL || 'https://medical-external-api.onrender.com/api/v1',
};

// API Types
export const API_TYPE = {
  CRUD: 'crud',
  BUSINESS: 'business',
  EXTERNAL: 'external',
};

/**
 * Get API base URL by type
 * @param {string} type - API type (crud, business, external)
 * @returns {string} Base URL
 */
export const getApiUrl = (type) => {
  return API_URLS[type] || API_URLS.crud;
};

export default API_URLS;
