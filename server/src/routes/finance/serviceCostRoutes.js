import express from 'express';
import auth from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import {
  getServiceCosts,
  getServiceCost,
  reviewServiceCost,
  generateInvoice,
  getServiceCostSummary,
  updateServiceCost,
  deleteServiceCost
} from '../../controllers/finance/serviceCostController.js';

const router = express.Router();

// All routes require authentication and finance manager role
router.use(auth);
router.use(allowRoles('finance_manager', 'admin'));

// Get all service costs
router.get('/', getServiceCosts);

// Get service cost summary (must be before /:id route)
router.get('/summary', getServiceCostSummary);

// Get single service cost
router.get('/:id', getServiceCost);

// Review service cost
router.put('/:id/review', reviewServiceCost);

// Generate invoice
router.post('/:id/generate-invoice', generateInvoice);

// Update service cost
router.put('/:id', updateServiceCost);

// Delete service cost
router.delete('/:id', deleteServiceCost);

export default router;