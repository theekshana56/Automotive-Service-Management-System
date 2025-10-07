import express from 'express';
import {
  getInventoryPayments,
  getInventoryPayment,
  createInventoryPayment,
  makeInventoryPayment,
  updateInventoryPayment,
  getInventoryPaymentSummary,
  deleteInventoryPayment
} from '../../controllers/finance/inventoryPaymentController.js';
import { protect, authorize } from '../../middleware/finance/auth.js';

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('finance_manager', 'admin'));

// @route   GET /api/finance/inventory-payments
// @desc    Get all inventory payments
// @access  Private (Finance Manager, Admin)
router.get('/', getInventoryPayments);

// @route   GET /api/finance/inventory-payments/summary
// @desc    Get inventory payment summary
// @access  Private (Finance Manager, Admin)
router.get('/summary', getInventoryPaymentSummary);

// @route   GET /api/finance/inventory-payments/:id
// @desc    Get single inventory payment
// @access  Private (Finance Manager, Admin)
router.get('/:id', getInventoryPayment);

// @route   POST /api/finance/inventory-payments
// @desc    Create inventory payment from purchase order
// @access  Private (Finance Manager, Admin)
router.post('/', createInventoryPayment);

// @route   PUT /api/finance/inventory-payments/:id/pay
// @desc    Make payment for inventory
// @access  Private (Finance Manager, Admin)
router.put('/:id/pay', makeInventoryPayment);

// @route   PUT /api/finance/inventory-payments/:id
// @desc    Update inventory payment
// @access  Private (Finance Manager, Admin)
router.put('/:id', updateInventoryPayment);

// @route   DELETE /api/finance/inventory-payments/:id
// @desc    Delete inventory payment
// @access  Private (Finance Manager, Admin)
router.delete('/:id', deleteInventoryPayment);

export default router;
