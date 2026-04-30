const DOMPurify = require('isomorphic-dompurify');

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript while preserving safe formatting
 */

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false
  });
};

/**
 * Sanitize plain text (no HTML allowed)
 */
const sanitizePlainText = (input) => {
  if (typeof input !== 'string') return input;
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
};

/**
 * Middleware to sanitize request body
 * Recursively sanitizes all string values in req.body
 */
const sanitizeBody = (allowHtml = false) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, allowHtml);
    }
    next();
  };
};

/**
 * Recursively sanitize an object
 */
const sanitizeObject = (obj, allowHtml = false) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' 
      ? (allowHtml ? sanitizeInput(obj) : sanitizePlainText(obj))
      : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowHtml));
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeObject(obj[key], allowHtml);
    }
  }
  return sanitized;
};

/**
 * Sanitize specific fields that allow HTML (messages, announcements, etc.)
 */
const sanitizeHtmlFields = (...fields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      fields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          req.body[field] = sanitizeInput(req.body[field]);
        }
      });
    }
    next();
  };
};

module.exports = {
  sanitizeInput,
  sanitizePlainText,
  sanitizeBody,
  sanitizeHtmlFields,
  sanitizeObject
};
