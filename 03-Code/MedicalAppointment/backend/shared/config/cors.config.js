/**
 * CORS Configuration
 * Centralized CORS settings for all API services
 * 
 * @module shared/config/cors.config
 */

const allowedOrigins = [
  // Development
  'http://127.0.0.1:5500',
  'http://localhost:5500',
  'http://localhost:5173',
  'http://localhost:5174',
  // Production - Vercel (add all your Vercel URLs)
  'https://medical-appointment-frontend-ten.vercel.app',
  'https://t6-awd-medical-appointment-web-syst.vercel.app',
  'https://fronttemporalappointments.vercel.app',
  'https://medical-appointment-web-system.vercel.app',
  'https://medical-appointment-web-system-stevven23s-projects.vercel.app',
  // Dynamic from env
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_2,
  process.env.FRONTEND_URL_PROD
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    // Allow exact matches or any localhost/127.0.0.1 on any port (dev convenience)
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    ) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 204
};

/**
 * Preflight middleware for handling OPTIONS requests
 */
const preflightMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Accept allowed origins or any localhost/127.0.0.1 variants
  if (
    origin && (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost') ||
      origin.startsWith('http://127.0.0.1')
    )
  ) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
};

module.exports = {
  corsOptions,
  preflightMiddleware,
  allowedOrigins
};
