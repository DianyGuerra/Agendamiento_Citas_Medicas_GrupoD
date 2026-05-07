/**
 * Utility Functions
 * Common utility functions shared across services
 * 
 * @module shared/utils/helpers.utils
 */

/**
 * Converts time string "HH:MM:SS" or "HH:MM" to minutes from midnight
 * @param {string} timeStr - Time string
 * @returns {number} Minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  const parts = timeStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
};

/**
 * Converts minutes from midnight to time string "HH:MM"
 * @param {number} minutes - Minutes from midnight
 * @returns {string} Time string
 */
const minutesToTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

/**
 * Formats date to ISO string without time
 * @param {Date|string} date - Date to format
 * @returns {string} YYYY-MM-DD format
 */
const formatDateISO = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

/**
 * Formats date for display in Spanish locale
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
const formatDateDisplay = (date) => {
  return new Date(date).toLocaleString('es-EC', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'America/Guayaquil'
  });
};

/**
 * Generates a unique reference code
 * @param {string} prefix - Code prefix
 * @returns {string} Reference code
 */
const generateReferenceCode = (prefix) => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Calculates age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number} Age in years
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Validates UUID format
 * @param {string} id - UUID to validate
 * @returns {boolean}
 */
const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
};

/**
 * Removes null and undefined values from object
 * @param {Object} obj - Object to clean
 * @returns {Object} Cleaned object
 */
const cleanObject = (obj) => {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Creates pagination object for API responses
 * @param {number} total - Total items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination object
 */
const createPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

/**
 * Parses pagination query parameters
 * @param {Object} query - Request query object
 * @returns {Object} Parsed pagination params
 */
const parsePaginationQuery = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = {
  timeToMinutes,
  minutesToTime,
  formatDateISO,
  formatDateDisplay,
  generateReferenceCode,
  calculateAge,
  isValidEmail,
  isValidUUID,
  cleanObject,
  createPagination,
  parsePaginationQuery
};
