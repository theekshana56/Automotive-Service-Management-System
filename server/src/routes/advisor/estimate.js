import express from 'express';
import auth from '../../middleware/auth.js';
import Notification from '../../models/inventory/Notification.js';
import Booking from '../../models/Booking.js';
import { createServiceCostFromEstimate, getAdvisorServiceCosts, getServiceCost } from '../../controllers/advisor/serviceCostController.js';

const router = express.Router();

// List assigned jobs awaiting cost estimation for this advisor
router.get('/assigned', auth, async (req, res) => {
  try {
    // simple heuristic: bookings assigned by this advisor in last 7 days, not completed
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const items = await Booking.find({
      advisor: req.user.id,
      status: { $ne: 'Completed' },
      createdAt: { $gte: since }
    }).select('_id serviceType vehicle date timeSlot estimatedCost').lean();
    res.json({ items: items.map(b => ({
      id: String(b._id),
      jobType: b.serviceType,
      vehiclePlate: b.vehicle?.plate || 'N/A',
      scheduledFor: `${b.date} ${b.timeSlot}`,
      estimatedCost: b.estimatedCost || 0
    })) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load assigned jobs' });
  }
});

// Send estimate summary to finance manager and staff member via notifications
router.post('/send', auth, createServiceCostFromEstimate);

// Get advisor service costs
router.get('/service-costs', auth, getAdvisorServiceCosts);

// Get single service cost
router.get('/service-costs/:id', auth, getServiceCost);

export default router;


