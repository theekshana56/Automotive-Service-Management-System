import express from 'express';
import paymentController from '../controllers/paymentController';

const router = express.Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/auth');
const { validate, schemas } = require('../middlewares/validate');

// All routes require authentication
router.use(protect);

// Get all payments with filters and pagination
router.get('/', paymentController.getPayments);

// Get payment by ID
router.get('/:id', paymentController.getPayment);

// Record a new payment (finance managers only)
router.post('/', authorize('finance_manager', 'admin'), validate(schemas.payment), paymentController.createPayment);

// Process a refund (finance managers only)
router.post('/:id/refund', authorize('finance_manager', 'admin'), validate(schemas.payment), paymentController.processRefund);

export default router;