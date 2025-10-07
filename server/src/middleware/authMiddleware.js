import jwt from 'jsonwebtoken';
import User from '../models/User';



// Authenticate token middleware
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies['access_token'] || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.sub);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add helper methods to user object
    user.isManager = function() {
      return this.role === 'manager' || this.role === 'admin';
    };

    user.isInventoryManager = function() {
      return this.role === 'inventory_manager' || this.role === 'manager' || this.role === 'admin';
    };

    user.isAdmin = function() {
      return this.role === 'admin';
    };

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Require manager role
const requireManager = (req, res, next) => {
  if (!req.user || !req.user.isManager()) {
    return res.status(403).json({ 
      message: 'Access denied. Manager role required.' 
    });
  }
  next();
};

// Require inventory manager role
const requireInventoryManager = (req, res, next) => {
  if (!req.user || !req.user.isInventoryManager()) {
    return res.status(403).json({ 
      message: 'Access denied. Inventory Manager role required.' 
    });
  }
  next();
};

// Require admin role
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin()) {
    return res.status(403).json({ 
      message: 'Access denied. Admin role required.' 
    });
  }
  next();
};

export default {
  authenticateToken,
  requireManager,
  requireInventoryManager,
  requireAdmin
};