/**
 * Request Logger Middleware
 * Logs all incoming requests
 * 
 * @module shared/middleware/logger.middleware
 */

/**
 * Request logger middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Next middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  
  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(`[${logLevel}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

module.exports = { requestLogger };
