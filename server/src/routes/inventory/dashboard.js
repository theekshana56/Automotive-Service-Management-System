import express from 'express';
import auth from '../../middleware/auth.js';
import { getOverview, getTopUsedParts } from '../../controllers/inventory/dashboardController.js';

const router = express.Router();

// Overview KPIs
router.get('/overview', auth, getOverview);

// Top used parts
router.get('/top-used', auth, getTopUsedParts);

export default router;


