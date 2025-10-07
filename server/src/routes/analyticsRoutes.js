import express from 'express';
import { getBookingAnalytics, getMechanicStats } from '../controllers/analyticsController.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Get booking analytics (public access for homepage)
router.get('/bookings', getBookingAnalytics);

// Get mechanic statistics
router.get('/mechanic/:mechanicId', auth, getMechanicStats);

export default router;
