const db = require('../config/db');

// Middleware to extract and validate institution from request
async function tenantMiddleware(req, res, next) {
  try {
    // Get institution from various sources
    let institutionId = null;
    
    // 1. From query parameter (for institution login)
    if (req.query.institution) {
      const [institutions] = await db.query(
        'SELECT id FROM institutions WHERE subdomain = ? AND status = "active"',
        [req.query.institution]
      );
      if (institutions.length > 0) {
        institutionId = institutions[0].id;
      }
    }
    
    // 2. From authenticated user
    if (!institutionId && req.user && req.user.institution_id) {
      institutionId = req.user.institution_id;
    }
    
    // 3. From custom header (for API calls)
    if (!institutionId && req.headers['x-institution-id']) {
      institutionId = parseInt(req.headers['x-institution-id']);
    }

    // Validate institution exists and is active
    if (institutionId) {
      const [institutions] = await db.query(
        'SELECT id, name, subdomain, status, plan FROM institutions WHERE id = ? AND status = "active"',
        [institutionId]
      );
      
      if (institutions.length > 0) {
        req.institution = institutions[0];
        req.institutionId = institutionId;
      }
    }

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    next();
  }
}

// Middleware to require institution context
function requireTenant(req, res, next) {
  if (!req.institutionId) {
    return res.status(400).json({ error: 'Institution context required' });
  }
  next();
}

// Helper to add institution filter to queries
function addInstitutionFilter(baseQuery, institutionId) {
  if (baseQuery.includes('WHERE')) {
    return `${baseQuery} AND institution_id = ${institutionId}`;
  } else {
    return `${baseQuery} WHERE institution_id = ${institutionId}`;
  }
}

module.exports = {
  tenantMiddleware,
  requireTenant,
  addInstitutionFilter
};
