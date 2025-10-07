import express from 'express';
import {
  getCapital,
  initializeCapital,
  updateCapital,
  getCapitalTransactions
} from '../../controllers/finance/capitalController.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Helper function to check user roles
const checkRole = (user, roles) => {
  if (!user || !user.role) return false;
  return roles.includes(user.role) || user.role === 'admin';
};

// All routes require authentication and finance manager/admin role
router.use(auth, (req, res, next) => {
  if (!checkRole(req.user, ['finance_manager', 'admin'])) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only Finance Managers and Admins can access capital management.'
    });
  }
  next();
});

// @route   GET /api/finance/capital
// @desc    Get capital information
// @access  Private (Finance Manager, Admin)
router.get('/', getCapital);

// @route   POST /api/finance/capital/initialize
// @desc    Initialize capital
// @access  Private (Finance Manager, Admin)
router.post('/initialize', initializeCapital);

// @route   PUT /api/finance/capital
// @desc    Update capital amount
// @access  Private (Finance Manager, Admin)
router.put('/', updateCapital);

// @route   GET /api/finance/capital/transactions
// @desc    Get capital transactions
// @access  Private (Finance Manager, Admin)
router.get('/transactions', getCapitalTransactions);

export default router;
