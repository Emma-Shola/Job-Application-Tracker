const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from multiple sources
  const token = 
    req.header('x-auth-token') ||
    req.header('Authorization')?.replace('Bearer ', '') ||
    req.cookies?.token ||
    req.query?.token;

  // Check if no token
  if (!token) {
    return res.status(401).json({ 
      success: false,
      msg: 'Access denied. No token provided.' 
    });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // ✅ FIXED: Set consistent user object with id (not userId)
    req.user = { 
      id: decoded.userId,  // Use 'id' to match Job model's 'createdBy' field
      userId: decoded.userId // Keep both for compatibility
    };
    next();
  } catch (err) {
    let message = 'Token is not valid';
    
    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired';
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token';
    }
    
    res.status(401).json({ 
      success: false,
      msg: message 
    });
  }
};