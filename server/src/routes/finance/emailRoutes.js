import express from 'express';
import {
  sendInvoiceEmail,
  sendReceiptEmail,
  sendSalaryNotificationEmail,
  sendBulkInvoiceEmails,
  sendBulkSalaryNotificationEmails,
  getEmailStatus
} from '../../controllers/finance/emailController.js';
import { protect, authorize } from '../../middleware/finance/auth.js';

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('finance_manager', 'admin'));

// @route   POST /api/finance/email/send-invoice/:invoiceId
// @desc    Send invoice email to customer
// @access  Private (Finance Manager, Admin)
router.post('/send-invoice/:invoiceId', sendInvoiceEmail);

// @route   POST /api/finance/email/send-receipt/:paymentId
// @desc    Send payment receipt email to customer
// @access  Private (Finance Manager, Admin)
router.post('/send-receipt/:paymentId', sendReceiptEmail);

// @route   POST /api/finance/email/send-salary-notification/:salaryId
// @desc    Send salary notification email to staff
// @access  Private (Finance Manager, Admin)
router.post('/send-salary-notification/:salaryId', sendSalaryNotificationEmail);

// @route   POST /api/finance/email/send-bulk-invoices
// @desc    Send bulk invoice emails
// @access  Private (Finance Manager, Admin)
router.post('/send-bulk-invoices', sendBulkInvoiceEmails);

// @route   POST /api/finance/email/send-bulk-salary-notifications
// @desc    Send bulk salary notification emails
// @access  Private (Finance Manager, Admin)
router.post('/send-bulk-salary-notifications', sendBulkSalaryNotificationEmails);

// @route   GET /api/finance/email/status
// @desc    Get email sending status
// @access  Private (Finance Manager, Admin)
router.get('/status', getEmailStatus);

export default router;
