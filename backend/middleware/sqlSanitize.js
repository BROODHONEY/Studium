/**
 * SQL Injection Protection
 * Sanitizes user input for Supabase queries
 */

/**
 * Sanitize search terms for ILIKE queries
 * Escapes special SQL wildcards and characters
 */
const sanitizeSearchTerm = (term) => {
  if (typeof term !== 'string') return '';
  
  // Escape SQL wildcards and special characters
  return term
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/%/g, '\\%')    // Escape % wildcard
    .replace(/_/g, '\\_')    // Escape _ wildcard
    .replace(/'/g, "''")     // Escape single quotes
    .trim();
};

/**
 * Sanitize email for search
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  // Basic email validation and sanitization
  const sanitized = email.toLowerCase().trim();
  
  // Remove any SQL injection attempts
  if (sanitized.includes('--') || sanitized.includes(';') || sanitized.includes('/*')) {
    return '';
  }
  
  return sanitizeSearchTerm(sanitized);
};

/**
 * Validate and sanitize UUID
 */
const sanitizeUUID = (uuid) => {
  if (typeof uuid !== 'string') return null;
  
  // UUID format: 8-4-4-4-12 hexadecimal characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return null;
  }
  
  return uuid.toLowerCase();
};

/**
 * Sanitize numeric input
 */
const sanitizeNumber = (value, min = null, max = null) => {
  const num = Number(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  if (min !== null && num < min) return null;
  if (max !== null && num > max) return null;
  
  return num;
};

/**
 * Sanitize array of values
 */
const sanitizeArray = (arr, sanitizer = sanitizeSearchTerm) => {
  if (!Array.isArray(arr)) return [];
  
  return arr
    .filter(item => item != null)
    .map(item => sanitizer(item))
    .filter(item => item !== '' && item !== null);
};

module.exports = {
  sanitizeSearchTerm,
  sanitizeEmail,
  sanitizeUUID,
  sanitizeNumber,
  sanitizeArray
};
