// ES module imports
import express from 'express';
import authRequired from '../middleware/auth.js';
import {
  submitForumQuestion,
  getForumQuestions,
  updateForumQuestionStatus,
  getForumStats
} from '../controllers/contactController.js';

const router = express.Router();

// Middleware to check if user is HR manager or admin
const checkHRManagerAccess = (req, res, next) => {
  console.log('🔐 Contact route auth check - User:', req.user);
  console.log('🔐 Contact route auth check - Role:', req.user?.role);

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'hr_manager' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. HR Manager or Admin role required.'
    });
  }

  next();
};

// Public routes
router.post('/forum', submitForumQuestion);

// Apply authentication middleware to all protected routes
router.use(authRequired);

// Protected routes (HR Manager/Admin only)
router.get('/forum/questions', checkHRManagerAccess, getForumQuestions);
router.get('/forum/stats', checkHRManagerAccess, getForumStats);
router.put('/forum/questions/:id/status', checkHRManagerAccess, updateForumQuestionStatus);

// ES module export
export default router;
