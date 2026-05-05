const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Normalize the user object to use snake_case for consistency
    req.user = {
      id: decoded.id,
      role: decoded.role,
      institution_id: decoded.institutionId || decoded.institution_id,
      email: decoded.email
    };
    
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;
module.exports.authenticate = authenticate;