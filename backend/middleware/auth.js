const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Extract token from all standard and fallback header variants or query params
  // (Fixes hosting/cPanel/Apache/Nginx proxy header stripping issues in production)
  const authHeader = 
    req.headers.authorization || 
    req.headers.Authorization || 
    req.headers['x-access-token'] || 
    req.headers['x-auth-token'] || 
    req.headers.token;

  if (authHeader) {
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof authHeader === 'string') {
      token = authHeader; // Direct token string without Bearer prefix
    }
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Get user from the token
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists. Please login again.' });
    }

    // Check if token version matches
    if (decoded.version !== undefined && req.user.tokenVersion !== undefined && decoded.version !== req.user.tokenVersion) {
      console.log('Token version mismatch for user:', req.user.email);
      console.log('Token version:', decoded.version, 'Current version:', req.user.tokenVersion);
      return res.status(401).json({ 
        message: 'Session expired. Please login again.' 
      });
    }

    // Populate shop ID from header, query, or user profile
    const isValidShopId = (id) => {
      return id && id !== 'undefined' && id !== 'null' && id !== '[object Object]' && mongoose.Types.ObjectId.isValid(id);
    };

    const shopHeader = req.headers['x-shop-id'] || req.headers['X-Shop-Id'] || req.headers.shopid;
    if (isValidShopId(shopHeader)) {
      req.shopId = shopHeader.toString();
    } else if (isValidShopId(req.query.shopId)) {
      req.shopId = req.query.shopId.toString();
    } else if (req.user && req.user.activeShop) {
      const userShopId = typeof req.user.activeShop === 'object' ? req.user.activeShop._id : req.user.activeShop;
      if (isValidShopId(userShopId)) {
        req.shopId = userShopId.toString();
      }
    }

    next();
    return;
  } catch (error) {
    console.error('Auth protect error:', error.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  const authHeader = 
    req.headers.authorization || 
    req.headers.Authorization || 
    req.headers['x-access-token'] || 
    req.headers['x-auth-token'] || 
    req.headers.token;

  if (authHeader) {
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (typeof authHeader === 'string') {
      token = authHeader;
    }
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (token && token !== 'null' && token !== 'undefined') {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        const isValidShopId = (id) => {
          return id && id !== 'undefined' && id !== 'null' && id !== '[object Object]' && mongoose.Types.ObjectId.isValid(id);
        };
        const shopHeader = req.headers['x-shop-id'] || req.headers['X-Shop-Id'] || req.headers.shopid;
        if (isValidShopId(shopHeader)) {
          req.shopId = shopHeader.toString();
        } else if (isValidShopId(req.query.shopId)) {
          req.shopId = req.query.shopId.toString();
        } else if (req.user.activeShop) {
          const userShopId = typeof req.user.activeShop === 'object' ? req.user.activeShop._id : req.user.activeShop;
          if (isValidShopId(userShopId)) {
            req.shopId = userShopId.toString();
          }
        }
      }
    } catch (error) {
      console.error('optionalProtect error:', error.message);
    }
  }

  next();
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user?.role || 'Guest'}' is not authorized to access this resource` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize, optionalProtect };