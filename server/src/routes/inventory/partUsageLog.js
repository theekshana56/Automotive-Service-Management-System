import express from 'express';
import { createUsageLog, getUsageLogs, downloadUsageLogCSV } from '../../controllers/inventory/partUsageLogController.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// POST: Log part usage
router.post('/', auth, createUsageLog);
// GET: List/filter usage logs
router.get('/', auth, getUsageLogs);
// Download usage log as CSV
router.get('/download.csv', auth, downloadUsageLogCSV);

export default router;
