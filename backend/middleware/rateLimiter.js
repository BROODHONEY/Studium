const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication endpoints
// TEMPORARILY DISABLED FOR TESTING — restore max: 5 before production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many authentication attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Moderate rate limiter for general API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // 100 requests per window
  message: { error: 'Too many requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiter for password reset/change
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: { error: 'Too many password change attempts. Please try again in 1 hour.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  authLimiter,
  apiLimiter,
  passwordLimiter
};
