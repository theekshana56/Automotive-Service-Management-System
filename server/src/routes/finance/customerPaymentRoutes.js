import express from 'express';
import auth from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import {
  calculateCustomerPayment,
  getServiceCostsWithPayments,
  processCustomerPaymentRequest,
  getCustomerPaymentSummary,
  getCustomerPayments
} from '../../controllers/finance/customerPaymentController.js';

const router = express.Router();

// All routes require authentication and finance manager role
router.use(auth);
router.use(allowRoles('finance_manager', 'admin'));

// Calculate customer payment with 80% margin
router.post('/calculate', calculateCustomerPayment);

// Get service costs with customer payment calculations
router.get('/service-costs', getServiceCostsWithPayments);

// Process customer payment
router.post('/process', processCustomerPaymentRequest);

// Get customer payment summary
router.get('/summary', getCustomerPaymentSummary);

// Get all customer payments
router.get('/', getCustomerPayments);

export default router;