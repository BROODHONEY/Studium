/**
 * Account Lockout Mechanism
 * Tracks failed login attempts and locks accounts after threshold
 */

const logger = require('../config/logger');

// In-memory store for failed attempts (use Redis in production)
const failedAttempts = new Map();
const lockedAccounts = new Map();

const LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  attemptWindow: 15 * 60 * 1000 // 15 minutes
};

/**
 * Get account key (email or phone + institution)
 */
const getAccountKey = (identifier, institutionId) => {
  return `${identifier}:${institutionId}`;
};

/**
 * Check if account is locked
 */
const isAccountLocked = (identifier, institutionId) => {
  const key = getAccountKey(identifier, institutionId);
  const lockInfo = lockedAccounts.get(key);
  
  if (!lockInfo) return false;
  
  // Check if lockout period has expired
  if (Date.now() > lockInfo.lockedUntil) {
    lockedAccounts.delete(key);
    failedAttempts.delete(key);
    return false;
  }
  
  return true;
};

/**
 * Get remaining lockout time in seconds
 */
const getRemainingLockoutTime = (identifier, institutionId) => {
  const key = getAccountKey(identifier, institutionId);
  const lockInfo = lockedAccounts.get(key);
  
  if (!lockInfo) return 0;
  
  const remaining = Math.ceil((lockInfo.lockedUntil - Date.now()) / 1000);
  return Math.max(0, remaining);
};

/**
 * Record failed login attempt
 */
const recordFailedAttempt = (identifier, institutionId, ip) => {
  const key = getAccountKey(identifier, institutionId);
  const now = Date.now();
  
  let attempts = failedAttempts.get(key) || [];
  
  // Remove attempts outside the window
  attempts = attempts.filter(timestamp => now - timestamp < LOCKOUT_CONFIG.attemptWindow);
  
  // Add new attempt
  attempts.push(now);
  failedAttempts.set(key, attempts);
  
  // Check if should lock account
  if (attempts.length >= LOCKOUT_CONFIG.maxAttempts) {
    const lockedUntil = now + LOCKOUT_CONFIG.lockoutDuration;
    lockedAccounts.set(key, { lockedUntil, attempts: attempts.length });
    
    logger.securityEvent('ACCOUNT_LOCKED', {
      identifier,
      institutionId,
      ip,
      attempts: attempts.length,
      lockedUntil: new Date(lockedUntil).toISOString()
    });
    
    return true; // Account is now locked
  }
  
  return false; // Not locked yet
};

/**
 * Clear failed attempts on successful login
 */
const clearFailedAttempts = (identifier, institutionId) => {
  const key = getAccountKey(identifier, institutionId);
  failedAttempts.delete(key);
  lockedAccounts.delete(key);
};

/**
 * Get number of remaining attempts
 */
const getRemainingAttempts = (identifier, institutionId) => {
  const key = getAccountKey(identifier, institutionId);
  const attempts = failedAttempts.get(key) || [];
  const now = Date.now();
  
  // Count only recent attempts
  const recentAttempts = attempts.filter(timestamp => now - timestamp < LOCKOUT_CONFIG.attemptWindow);
  
  return Math.max(0, LOCKOUT_CONFIG.maxAttempts - recentAttempts.length);
};

/**
 * Middleware to check account lockout
 */
const checkAccountLockout = (req, res, next) => {
  const { email, phone, institutionId } = req.body;
  const identifier = email || phone;
  
  if (!identifier || !institutionId) {
    return next();
  }
  
  if (isAccountLocked(identifier, institutionId)) {
    const remainingTime = getRemainingLockoutTime(identifier, institutionId);
    const minutes = Math.ceil(remainingTime / 60);
    
    logger.securityEvent('LOCKED_ACCOUNT_ACCESS_ATTEMPT', {
      identifier,
      institutionId,
      ip: req.ip
    });
    
    return res.status(429).json({
      error: `Account temporarily locked due to multiple failed login attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
      lockedUntil: remainingTime
    });
  }
  
  next();
};

module.exports = {
  isAccountLocked,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts,
  getRemainingLockoutTime,
  checkAccountLockout
};
