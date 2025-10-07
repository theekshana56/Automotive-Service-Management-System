import express from 'express';
import {
  getBookingHistory,
  getAdvisorJobHistory,
  getAdvisorJobStatistics,
  updateJobStatusManually,
  getJobTimeline
} from '../../controllers/advisor/jobHistoryController.js';
import auth from '../../middleware/auth.js';
import { body, param } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';

const router = express.Router();

// Validation middleware
const updateStatusValidation = [
  param('bookingId').isMongoId().withMessage('Valid booking ID is required'),
  body('newStatus').isIn(['Pending', 'Confirmed', 'In Progress', 'Inspection Complete', 'Work In Progress', 'Completed', 'Cancelled', 'On Hold']).withMessage('Valid status is required'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes must be less than 1000 characters'),
  body('estimatedCost').optional().isNumeric().withMessage('Estimated cost must be a number'),
  body('actualCost').optional().isNumeric().withMessage('Actual cost must be a number')
];

// Routes
router.get('/history', auth, getAdvisorJobHistory);
router.get('/statistics', auth, getAdvisorJobStatistics);
router.get('/booking/:bookingId/history', auth, getBookingHistory);
router.get('/booking/:bookingId/timeline', auth, getJobTimeline);
router.patch('/booking/:bookingId/status', auth, updateStatusValidation, validateRequest, updateJobStatusManually);

export default router;
