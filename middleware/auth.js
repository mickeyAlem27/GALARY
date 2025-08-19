const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          error: 'Not authorized, user not found' 
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('Authentication error:', error);
      return res.status(401).json({ 
        success: false,
        error: 'Not authorized, token failed' 
      });
    }
  }

  // No token provided
  return res.status(401).json({ 
    success: false,
    error: 'Not authorized, no token' 
  });
};

module.exports = { protect };
