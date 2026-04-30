const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'studiplus-api' },
  transports: [
    // Error logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Security logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/security.log'), 
      level: 'warn',
      maxsize: 5242880,
      maxFiles: 5
    }),
    // Combined logs
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security event logging helpers
logger.securityEvent = (event, details) => {
  logger.warn('SECURITY_EVENT', {
    event,
    ...details,
    timestamp: new Date().toISOString()
  });
};

logger.authFailure = (email, ip, reason) => {
  logger.securityEvent('AUTH_FAILURE', {
    email,
    ip,
    reason
  });
};

logger.authSuccess = (userId, email, ip) => {
  logger.info('AUTH_SUCCESS', {
    userId,
    email,
    ip,
    timestamp: new Date().toISOString()
  });
};

logger.suspiciousActivity = (activity, details) => {
  logger.securityEvent('SUSPICIOUS_ACTIVITY', {
    activity,
    ...details
  });
};

module.exports = logger;
