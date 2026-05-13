/**
 * Validation Middleware
 * Request validation using validators
 * 
 * @module shared/middleware/validation.middleware
 */

const { ValidationError } = require('../errors');

/**
 * Creates a validation middleware
 * @param {Object} schema - Validation schema
 * @param {string} [property='body'] - Request property to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    const errors = [];

    // Check required fields
    if (schema.required) {
      schema.required.forEach(field => {
        if (data[field] === undefined || data[field] === null || data[field] === '') {
          errors.push({ field, message: `El campo '${field}' es requerido` });
        }
      });
    }

    // Check field types
    if (schema.types) {
      Object.entries(schema.types).forEach(([field, type]) => {
        if (data[field] !== undefined && data[field] !== null) {
          if (!validateType(data[field], type)) {
            errors.push({ field, message: `El campo '${field}' debe ser de tipo ${type}` });
          }
        }
      });
    }

    // Check custom validators
    if (schema.custom) {
      schema.custom.forEach(({ field, validator, message }) => {
        if (data[field] !== undefined && !validator(data[field])) {
          errors.push({ field, message });
        }
      });
    }

    if (errors.length > 0) {
      return next(new ValidationError('Errores de validación', errors));
    }

    next();
  };
};

/**
 * Validates a value against a type
 * @param {*} value - Value to validate
 * @param {string} type - Expected type
 * @returns {boolean}
 */
const validateType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'email':{
      if (typeof value !== 'string' || value.length > 254) return false;
      const html5EmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;    
      return html5EmailRegex.test(value);}
    case 'uuid':
      return typeof value === 'string' && 
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    case 'date':
      return !isNaN(Date.parse(value));
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && !Array.isArray(value) && value !== null;
    default:
      return true;
  }
};

/**
 * Sanitizes request body by removing undefined and null values
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (req.body[key] === undefined) {
        delete req.body[key];
      }
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  next();
};

/**
 * Pre-defined validation schemas
 */
const schemas = {
  // Auth schemas
  auth: {
    register: {
      required: ['email', 'password', 'first_name', 'last_name'],
      types: {
        email: 'email',
        password: 'string',
        first_name: 'string',
        last_name: 'string'
      },
      custom: [
        {
          field: 'password',
          validator: (value) => value && value.length >= 8,
          message: 'La contraseña debe tener al menos 8 caracteres'
        }
      ]
    },
    login: {
      required: ['email', 'password'],
      types: {
        email: 'email',
        password: 'string'
      }
    }
  },
  
  // User schemas
  user: {
    create: {
      required: ['email', 'password', 'first_name', 'last_name', 'role_id'],
      types: {
        email: 'email',
        password: 'string',
        first_name: 'string',
        last_name: 'string',
        role_id: 'uuid'
      }
    },
    update: {
      types: {
        email: 'email',
        first_name: 'string',
        last_name: 'string'
      }
    }
  },

  // Patient schemas
  patient: {
    create: {
      required: ['user_id'],
      types: {
        user_id: 'uuid',
        date_of_birth: 'date',
        phone: 'string',
        address: 'string'
      }
    },
    update: {
      types: {
        date_of_birth: 'date',
        phone: 'string',
        address: 'string',
        emergency_contact_name: 'string',
        emergency_contact_phone: 'string'
      }
    }
  },

  // Doctor schemas
  doctor: {
    create: {
      required: ['user_id', 'specialty_id'],
      types: {
        user_id: 'uuid',
        specialty_id: 'uuid',
        license_number: 'string'
      }
    },
    update: {
      types: {
        specialty_id: 'uuid',
        license_number: 'string',
        consultation_fee: 'number'
      }
    }
  },

  // Appointment schemas
  appointment: {
    create: {
      required: ['patient_id', 'doctor_id', 'scheduled_start'],
      types: {
        patient_id: 'uuid',
        doctor_id: 'uuid',
        scheduled_start: 'date'
      }
    },
    update: {
      types: {
        scheduled_start: 'date',
        status: 'string',
        notes: 'string'
      }
    }
  },

  // Schedule schemas
  schedule: {
    create: {
      required: ['doctor_id', 'day_of_week', 'start_time', 'end_time'],
      types: {
        doctor_id: 'uuid',
        day_of_week: 'number',
        start_time: 'string',
        end_time: 'string'
      },
      custom: [
        {
          field: 'day_of_week',
          validator: (value) => value >= 0 && value <= 6,
          message: 'day_of_week debe estar entre 0 (domingo) y 6 (sábado)'
        }
      ]
    }
  },

  // Prescription schemas
  prescription: {
    create: {
      required: ['appointment_id', 'medications'],
      types: {
        appointment_id: 'uuid',
        medications: 'array',
        notes: 'string'
      }
    }
  },

  // Consultation note schemas
  consultationNote: {
    create: {
      required: ['appointment_id'],
      types: {
        appointment_id: 'uuid',
        subjective: 'string',
        objective: 'string',
        assessment: 'string',
        plan: 'string'
      }
    }
  },

  // Billing schemas
  billing: {
    create: {
      required: ['appointment_id', 'amount'],
      types: {
        appointment_id: 'uuid',
        amount: 'number',
        status: 'string',
        payment_method: 'string'
      }
    }
  },

  // ID parameter validation
  params: {
    id: {
      required: ['id'],
      types: {
        id: 'uuid'
      }
    }
  }
};

module.exports = {
  validate,
  validateType,
  sanitizeBody,
  schemas
};
