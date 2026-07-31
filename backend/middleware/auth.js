const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Check for token in header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists. Please login again.' });
      }

      // CRITICAL: Check if token version matches
      // This invalidates old tokens when user status changes or on new login
      if (decoded.version !== req.user.tokenVersion) {
        console.log('Token version mismatch for user:', req.user.email);
        console.log('Token version:', decoded.version, 'Current version:', req.user.tokenVersion);
        return res.status(401).json({ 
          message: 'Session expired. Please login again.' 
        });
      }

      // Populate shop ID from header, query, or user profile
      if (req.headers['x-shop-id'] && req.headers['x-shop-id'] !== 'undefined' && req.headers['x-shop-id'] !== 'null') {
        req.shopId = req.headers['x-shop-id'];
      } else if (req.query.shopId && req.query.shopId !== 'undefined' && req.query.shopId !== 'null') {
        req.shopId = req.query.shopId;
      } else if (req.user && req.user.activeShop) {
        req.shopId = req.user.activeShop.toString();
      }

      next();
      return;
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  // If no header token, check for token in query parameters
  if (req.query.token) {
    try {
      // Get token from query parameter
      token = req.query.token;

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      next();
      return;
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        if (req.headers['x-shop-id'] && req.headers['x-shop-id'] !== 'undefined' && req.headers['x-shop-id'] !== 'null') {
          req.shopId = req.headers['x-shop-id'];
        } else if (req.query.shopId && req.query.shopId !== 'undefined' && req.query.shopId !== 'null') {
          req.shopId = req.query.shopId;
        } else if (req.user.activeShop) {
          req.shopId = req.user.activeShop.toString();
        }
      }
      // If version mismatch or not found, just ignore and treat as guest
    } catch (error) {
      console.error('optionalProtect error:', error.message);
    }
  }

  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.role}' is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize, optionalProtect };