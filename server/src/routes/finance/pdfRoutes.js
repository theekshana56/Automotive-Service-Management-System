import express from 'express';
import {
  generateStaffSalaryPDF,
  generateCustomerPaymentPDF,
  generateServiceCostPDF,
  generatePurchaseOrderCostPDF,
  generateCombinedFinancePDF,
  generateProfitLossPDF,
  generateFinalAmountPDF
} from '../../controllers/finance/pdfController.js';
import { protect, authorize } from '../../middleware/finance/auth.js';
import Staff from '../../models/staffMng/Staff.js';
import { createAutoSalaryRecord } from '../../utils/autoSalaryCreation.js';

const router = express.Router();

// Apply authentication and authorization to all routes
router.use(protect);
router.use(authorize('finance_manager', 'admin'));

// @route   GET /api/finance/pdf/staff-salary
// @desc    Generate staff salary report PDF
// @access  Private (Finance Manager, Admin)
router.get('/staff-salary', generateStaffSalaryPDF);

// @route   GET /api/finance/pdf/customer-payment
// @desc    Generate customer payment report PDF
// @access  Private (Finance Manager, Admin)
router.get('/customer-payment', generateCustomerPaymentPDF);

// @route   GET /api/finance/pdf/service-cost
// @desc    Generate service cost report PDF
// @access  Private (Finance Manager, Admin)
router.get('/service-cost', generateServiceCostPDF);

// @route   GET /api/finance/pdf/purchase-order-cost
// @desc    Generate purchase order cost report PDF
// @access  Private (Finance Manager, Admin)
router.get('/purchase-order-cost', generatePurchaseOrderCostPDF);

// @route   GET /api/finance/pdf/combined
// @desc    Generate combined finance report PDF
// @access  Private (Finance Manager, Admin)
router.get('/combined', generateCombinedFinancePDF);

// @route   GET /api/finance/pdf/profit-loss
// @desc    Generate profit/loss report PDF
// @access  Private (Finance Manager, Admin)
router.get('/profit-loss', generateProfitLossPDF);

// @route   GET /api/finance/pdf/final-amount
// @desc    Generate final amount report PDF
// @access  Private (Finance Manager, Admin)
router.get('/final-amount', generateFinalAmountPDF);

// @route   POST /api/finance/pdf/add-staff
// @desc    Add new staff member from finance module
// @access  Private (Finance Manager, Admin)
router.post('/add-staff', async (req, res) => {
  try {
    const { name, email, role, phone, address, basicSalary, hourlyRate } = req.body;

    // Check if staff member already exists
    const existingStaff = await Staff.findOne({ email });
    if (existingStaff) {
      return res.status(400).json({
        success: false,
        message: 'Staff member with this email already exists'
      });
    }

    // Create new staff member
    const staffData = {
      name,
      email,
      password: 'password123', // Default password
      role: role || 'staff',
      phone: phone || '',
      address: address || '',
      basicSalary: basicSalary || 0,
      hourlyRate: hourlyRate || 0
    };

    const staff = await Staff.create(staffData);

    // Automatically create salary record for new staff member
    try {
      await createAutoSalaryRecord(staff.email, req.user?.id || 'system');
      console.log('Auto-created salary record for:', staff.email);
    } catch (error) {
      console.error('Error creating auto salary record:', error.message);
    }

    res.json({
      success: true,
      message: 'Staff member added successfully',
      data: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Error adding staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add staff member',
      error: error.message
    });
  }
});

export default router;
