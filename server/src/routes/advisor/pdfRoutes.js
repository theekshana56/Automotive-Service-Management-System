import express from 'express';
import {
  generateJobHistoryPDFController,
  generateCostEstimationPDFController
} from '../../controllers/advisor/pdfController.js';
import authRequired from '../../middleware/auth.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authRequired);

// @route   GET /api/advisor/pdf/job-history
// @desc    Generate job history report PDF
// @access  Private
router.get('/job-history', generateJobHistoryPDFController);

// @route   POST /api/advisor/pdf/cost-estimation
// @desc    Generate cost estimation report PDF
// @access  Private
router.post('/cost-estimation', generateCostEstimationPDFController);

export default router;
