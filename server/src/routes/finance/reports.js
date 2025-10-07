import express from 'express';
import reportController from '../controllers/reportController';

const router = express.Router();

const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Get income statement
router.get('/income-statement', reportController.getIncomeStatement);

// Get cash flow statement
router.get('/cash-flow', reportController.getCashFlowStatement);

// Get balance sheet
router.get('/balance-sheet', reportController.getBalanceSheet);

// Get accounts receivable aging
router.get('/ar-aging', reportController.getAccountsReceivableAging);

// Get accounts payable aging
router.get('/ap-aging', reportController.getAccountsPayableAging);

// Export report as PDF
router.get('/export/pdf/:reportType', reportController.exportReportAsPDF);

// Export report as CSV
router.get('/export/csv/:reportType', reportController.exportReportAsCSV);

export default router;