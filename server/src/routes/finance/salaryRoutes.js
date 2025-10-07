import express from 'express';
import {
  getStaffSalaries,
  getStaffSalary,
  createStaffSalary,
  updateStaffSalary,
  approveStaffSalary,
  payStaffSalary,
  getSalarySummary,
  deleteStaffSalary,
  calculateSalaryFromAttendance,
  createSalaryFromAttendance,
  calculateAllSalariesFromAttendance,
  getComprehensiveSalarySummaryController,
  generateDetailedSalaryReport,
  populateSampleSalaryData,
  createMissingSalaryRecords,
  generateSalaryReportController,
  generateSalaryReportPDFController
} from '../../controllers/finance/salaryController.js';
import { protect, authorize } from '../../middleware/finance/auth.js';

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('finance_manager', 'admin'));

// @route   GET /api/finance/salaries
// @desc    Get all staff salaries
// @access  Private (Finance Manager, Admin)
router.get('/', getStaffSalaries);

// @route   GET /api/finance/salaries/summary
// @desc    Get salary summary for dashboard
// @access  Private (Finance Manager, Admin)
router.get('/summary', getSalarySummary);

// IMPORTANT: Place static report routes BEFORE the dynamic `/:id` route
// to prevent '/report' being captured as an ':id'
// @route   GET /api/finance/salaries/report
// @desc    Generate comprehensive salary report with overtime and totals
// @access  Private (Finance Manager, Admin)
router.get('/report', generateSalaryReportController);

// @route   GET /api/finance/salaries/report-pdf
// @desc    Generate comprehensive salary report PDF
// @access  Private (Finance Manager, Admin)
router.get('/report-pdf', generateSalaryReportPDFController);

// @route   GET /api/finance/salaries/:id
// @desc    Get single staff salary
// @access  Private (Finance Manager, Admin)
router.get('/:id', getStaffSalary);

// @route   POST /api/finance/salaries
// @desc    Create staff salary
// @access  Private (Finance Manager, Admin)
router.post('/', createStaffSalary);

// @route   PUT /api/finance/salaries/:id
// @desc    Update staff salary
// @access  Private (Finance Manager, Admin)
router.put('/:id', updateStaffSalary);

// @route   PUT /api/finance/salaries/:id/approve
// @desc    Approve staff salary
// @access  Private (Finance Manager, Admin)
router.put('/:id/approve', approveStaffSalary);

// @route   PUT /api/finance/salaries/:id/pay
// @desc    Pay staff salary
// @access  Private (Finance Manager, Admin)
router.put('/:id/pay', payStaffSalary);

// @route   DELETE /api/finance/salaries/:id
// @desc    Delete staff salary
// @access  Private (Finance Manager, Admin)
router.delete('/:id', deleteStaffSalary);

// @route   POST /api/finance/salaries/calculate
// @desc    Calculate salary from attendance and extra work data
// @access  Private (Finance Manager, Admin)
router.post('/calculate', calculateSalaryFromAttendance);

// @route   POST /api/finance/salaries/create-from-attendance
// @desc    Create salary record from attendance and extra work data
// @access  Private (Finance Manager, Admin)
router.post('/create-from-attendance', createSalaryFromAttendance);

// @route   POST /api/finance/salaries/calculate-all
// @desc    Calculate salaries for all staff from attendance data
// @access  Private (Finance Manager, Admin)
router.post('/calculate-all', calculateAllSalariesFromAttendance);

// @route   GET /api/finance/salaries/comprehensive-summary
// @desc    Get comprehensive salary summary
// @access  Private (Finance Manager, Admin)
router.get('/comprehensive-summary', getComprehensiveSalarySummaryController);

// @route   GET /api/finance/salaries/report/:staffEmail
// @desc    Generate detailed salary report
// @access  Private (Finance Manager, Admin)
router.get('/report/:staffEmail', generateDetailedSalaryReport);

// @route   POST /api/finance/salaries/populate-sample-data
// @desc    Populate database with sample salary data
// @access  Private (Finance Manager, Admin)
router.post('/populate-sample-data', populateSampleSalaryData);

// @route   POST /api/finance/salaries/populate-sample-data-test
// @desc    Populate database with sample salary data (no auth for testing)
// @access  Public (for testing only)
router.post('/populate-sample-data-test', populateSampleSalaryData);

// @route   POST /api/finance/salaries/create-missing-records
// @desc    Create salary records for all staff members who don't have them
// @access  Private (Finance Manager, Admin)
router.post('/create-missing-records', createMissingSalaryRecords);

export default router;
