/**
 * Base HTTP Client
 * Axios instance factory for each API service
 * 
 * @module services/httpClient
 */

import axios from 'axios';
import API_URLS, { API_TYPE } from '../config/api.config';
import { STORAGE_KEYS } from '../config/constants';

/**
 * Creates an axios instance for a specific API
 * @param {string} apiType - API type (crud, business, external)
 * @returns {AxiosInstance}
 */
const createHttpClient = (apiType) => {
  const instance = axios.create({
    baseURL: API_URLS[apiType],
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor - add auth token
  instance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor - handle errors
  instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !globalThis.location.pathname.includes('/login')) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/login';
    }

    const normalizedError = new Error(
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Error de conexión'
    );

    normalizedError.status = error.response?.status || 500;
    normalizedError.data = error.response?.data;

    return Promise.reject(normalizedError);
  }
);


  return instance;
};

// Create instances for each API
export const crudApi = createHttpClient(API_TYPE.CRUD);
export const businessApi = createHttpClient(API_TYPE.BUSINESS);
export const externalApi = createHttpClient(API_TYPE.EXTERNAL);

export default {
  crud: crudApi,
  business: businessApi,
  external: externalApi,
};
