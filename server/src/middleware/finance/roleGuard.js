const { authorize } = require('./auth');

// Role-based access control middleware
export const financeManagerOnly = authorize('finance_manager', 'admin');
export const adminOnly = authorize('admin');

// Generic role guard function
export const roleGuard = (role) => {
  return authorize(role);
};

// Check if user has permission to access resource
export const checkResourceAccess = (resourceType) => {
  return (req, res, next) => {
    // For now, all finance managers can access all resources
    // In a more complex system, you might check ownership or department
    if (req.user.role === 'admin' || req.user.role === 'finance_manager') {
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: `Not authorized to access ${resourceType}`
    });
  };
};