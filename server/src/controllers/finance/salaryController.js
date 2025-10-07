import StaffSalary from '../../models/finance/StaffSalary.js';
import User from '../../models/User.js';
import LedgerEntry from '../../models/finance/LedgerEntry.js';
import Staff from '../../models/staffMng/Staff.js';
import { 
  calculateStaffSalary, 
  createSalaryRecord, 
  calculateAllStaffSalaries, 
  getSalarySummary as getComprehensiveSalarySummary,
  generateSalaryReport 
} from '../../services/finance/salaryCalculationService.js';
import { generateStaffSalaryReportPDF } from '../../services/finance/pdfService.js';




// @desc    Get all staff salaries
// @route   GET /api/finance/salaries
// @access  Private (Finance Manager, Admin)
export const getStaffSalaries = async (req, res) => {
  try {
    const { status, staffId, payPeriod, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (staffId) {
      query.staffId = staffId;
    }
    
    if (payPeriod) {
      const [startDate, endDate] = payPeriod.split(',');
      query['payPeriod.startDate'] = { $gte: new Date(startDate) };
      query['payPeriod.endDate'] = { $lte: new Date(endDate) };
    }
    
    const salaries = await StaffSalary.find(query)
      .populate('staffId', 'name email role')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await StaffSalary.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: salaries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get single staff salary
// @route   GET /api/finance/salaries/:id
// @access  Private (Finance Manager, Admin)
export const getStaffSalary = async (req, res) => {
  try {
    const salary = await StaffSalary.findById(req.params.id)
      .populate('staffId', 'name email role phone')
      .populate('approvedBy', 'name')
      .populate('paidBy', 'name');
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: salary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create staff salary
// @route   POST /api/finance/salaries
// @access  Private (Finance Manager, Admin)
export const createStaffSalary = async (req, res) => {
  try {
    const staff = await User.findById(req.body.staffId);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }
    
    // Check if salary already exists for this pay period
    const existingSalary = await StaffSalary.findOne({
      staffId: req.body.staffId,
      'payPeriod.startDate': req.body.payPeriod.startDate,
      'payPeriod.endDate': req.body.payPeriod.endDate
    });
    
    if (existingSalary) {
      return res.status(400).json({
        success: false,
        message: 'Salary already exists for this pay period'
      });
    }
    
    const salaryData = {
      ...req.body,
      staffName: staff.name,
      staffRole: staff.role
    };
    
    const salary = await StaffSalary.create(salaryData);
    
    res.status(201).json({
      success: true,
      data: salary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Update staff salary
// @route   PUT /api/finance/salaries/:id
// @access  Private (Finance Manager, Admin)
export const updateStaffSalary = async (req, res) => {
  try {
    const salary = await StaffSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    
    if (salary.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update paid salary record'
      });
    }
    
    const updatedSalary = await StaffSalary.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedSalary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Approve staff salary
// @route   PUT /api/finance/salaries/:id/approve
// @access  Private (Finance Manager, Admin)
export const approveStaffSalary = async (req, res) => {
  try {
    const salary = await StaffSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    
    if (salary.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft salaries can be approved'
      });
    }
    
    salary.status = 'approved';
    salary.approvedBy = req.user.id;
    salary.approvedAt = new Date();
    
    await salary.save();
    
    res.status(200).json({
      success: true,
      data: salary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Pay staff salary
// @route   PUT /api/finance/salaries/:id/pay
// @access  Private (Finance Manager, Admin)
export const payStaffSalary = async (req, res) => {
  try {
    const salary = await StaffSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    
    if (salary.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved salaries can be paid'
      });
    }
    
    // Update salary status
    salary.status = 'paid';
    salary.paidBy = req.user.id;
    salary.paidAt = new Date();
    salary.paymentMethod = req.body.paymentMethod || 'bank_transfer';
    salary.bankDetails = req.body.bankDetails || {};
    
    await salary.save();
    
    // Create ledger entry for salary payment
    await LedgerEntry.create({
      description: `Salary payment for ${salary.staffName} - ${salary.payPeriod.startDate.toDateString()} to ${salary.payPeriod.endDate.toDateString()}`,
      debit: salary.calculations.netSalary,
      account: 'expenses',
      reference: salary._id,
      referenceType: 'salary_payment'
    });
    
    // Create ledger entry for EPF/ETF contributions
    if (salary.calculations.epfContribution.employer > 0) {
      await LedgerEntry.create({
        description: `EPF contribution for ${salary.staffName}`,
        debit: salary.calculations.epfContribution.employer,
        account: 'expenses',
        reference: salary._id,
        referenceType: 'epf_contribution'
      });
    }
    
    if (salary.calculations.etfContribution > 0) {
      await LedgerEntry.create({
        description: `ETF contribution for ${salary.staffName}`,
        debit: salary.calculations.etfContribution,
        account: 'expenses',
        reference: salary._id,
        referenceType: 'etf_contribution'
      });
    }
    
    res.status(200).json({
      success: true,
      data: salary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get salary summary for dashboard
// @route   GET /api/finance/salaries/summary
// @access  Private (Finance Manager, Admin)
export const getSalarySummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();
    
    const summary = await StaffSalary.aggregate([
      {
        $match: {
          'payPeriod.startDate': { $gte: start, $lte: end },
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalSalaries: { $sum: 1 },
          totalNetSalary: { $sum: '$calculations.netSalary' },
          totalGrossSalary: { $sum: '$calculations.grossSalary' },
          totalEPF: { $sum: '$calculations.epfContribution.employer' },
          totalETF: { $sum: '$calculations.etfContribution' },
          totalDeductions: { $sum: '$calculations.totalDeductions' }
        }
      }
    ]);
    
    const result = summary[0] || {
      totalSalaries: 0,
      totalNetSalary: 0,
      totalGrossSalary: 0,
      totalEPF: 0,
      totalETF: 0,
      totalDeductions: 0
    };
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Delete staff salary
// @route   DELETE /api/finance/salaries/:id
// @access  Private (Finance Manager, Admin)
export const deleteStaffSalary = async (req, res) => {
  try {
    const salary = await StaffSalary.findById(req.params.id);
    
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: 'Salary record not found'
      });
    }
    
    if (salary.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete paid salary record'
      });
    }
    
    await StaffSalary.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Salary record deleted successfully'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Calculate salary from attendance and extra work data
// @route   POST /api/finance/salaries/calculate
// @access  Private (Finance Manager, Admin)
export const calculateSalaryFromAttendance = async (req, res) => {
  try {
    const { staffEmail, startDate, endDate } = req.body;
    
    if (!staffEmail || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Staff email, start date, and end date are required'
      });
    }

    const salaryBreakdown = await calculateStaffSalary(staffEmail, new Date(startDate), new Date(endDate));
    
    res.status(200).json({
      success: true,
      data: salaryBreakdown
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create salary record from attendance and extra work data
// @route   POST /api/finance/salaries/create-from-attendance
// @access  Private (Finance Manager, Admin)
export const createSalaryFromAttendance = async (req, res) => {
  try {
    const { staffEmail, startDate, endDate } = req.body;
    
    if (!staffEmail || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Staff email, start date, and end date are required'
      });
    }

    const salaryRecord = await createSalaryRecord(
      staffEmail, 
      new Date(startDate), 
      new Date(endDate), 
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: salaryRecord,
      message: 'Salary record created successfully from attendance data'
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Calculate salaries for all staff from attendance data
// @route   POST /api/finance/salaries/calculate-all
// @access  Private (Finance Manager, Admin)
export const calculateAllSalariesFromAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const salaryCalculations = await calculateAllStaffSalaries(
      new Date(startDate), 
      new Date(endDate), 
      req.user.id
    );
    
    res.status(200).json({
      success: true,
      data: salaryCalculations,
      count: salaryCalculations.length
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Get comprehensive salary summary
// @route   GET /api/finance/salaries/comprehensive-summary
// @access  Private (Finance Manager, Admin)
export const getComprehensiveSalarySummaryController = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const summary = await getComprehensiveSalarySummary(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );
    
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Generate detailed salary report
// @route   GET /api/finance/salaries/report/:staffEmail
// @access  Private (Finance Manager, Admin)
export const generateDetailedSalaryReport = async (req, res) => {
  try {
    const { staffEmail } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date are required'
      });
    }

    const report = await generateSalaryReport(
      staffEmail,
      new Date(startDate),
      new Date(endDate)
    );
    
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Populate database with sample salary data
// @route   POST /api/finance/salaries/populate-sample-data
// @access  Private (Finance Manager, Admin)
export const populateSampleSalaryData = async (req, res) => {
  try {
    // Sample staff data
    const sampleStaffData = [
      {
        name: 'John Smith',
        email: 'john.smith@autoelite.com',
        role: 'staff_member',
        attendance: [
          {
            date: '2025-01-15',
            email: 'john.smith@autoelite.com',
            checkInTime: '2025-01-15T08:00:00.000Z',
            checkOutTime: '2025-01-15T17:00:00.000Z',
            hoursWorked: 9
          },
          {
            date: '2025-01-16',
            email: 'john.smith@autoelite.com',
            checkInTime: '2025-01-16T08:30:00.000Z',
            checkOutTime: '2025-01-16T17:30:00.000Z',
            hoursWorked: 9
          },
          {
            date: '2025-01-17',
            email: 'john.smith@autoelite.com',
            checkInTime: '2025-01-17T08:00:00.000Z',
            checkOutTime: '2025-01-17T16:30:00.000Z',
            hoursWorked: 8.5
          },
          {
            date: '2025-01-18',
            email: 'john.smith@autoelite.com',
            checkInTime: '2025-01-18T08:15:00.000Z',
            checkOutTime: '2025-01-18T17:15:00.000Z',
            hoursWorked: 9
          },
          {
            date: '2025-01-19',
            email: 'john.smith@autoelite.com',
            checkInTime: '2025-01-19T08:00:00.000Z',
            checkOutTime: '2025-01-19T17:00:00.000Z',
            hoursWorked: 9
          }
        ],
        extraWork: [
          {
            description: 'Emergency brake repair for customer',
            hours: 2.5,
            date: '2025-01-16'
          },
          {
            description: 'Overtime diagnostic work',
            hours: 1.5,
            date: '2025-01-18'
          }
        ]
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@autoelite.com',
        role: 'advisor',
        attendance: [
          {
            date: '2025-01-15',
            email: 'sarah.johnson@autoelite.com',
            checkInTime: '2025-01-15T09:00:00.000Z',
            checkOutTime: '2025-01-15T18:00:00.000Z',
            hoursWorked: 9
          },
          {
            date: '2025-01-16',
            email: 'sarah.johnson@autoelite.com',
            checkInTime: '2025-01-16T09:00:00.000Z',
            checkOutTime: '2025-01-16T18:00:00.000Z',
            hoursWorked: 9
          },
          {
            date: '2025-01-17',
            email: 'sarah.johnson@autoelite.com',
            checkInTime: '2025-01-17T09:00:00.000Z',
            checkOutTime: '2025-01-17T17:30:00.000Z',
            hoursWorked: 8.5
          },
          {
            date: '2025-01-18',
            email: 'sarah.johnson@autoelite.com',
            checkInTime: '2025-01-18T09:00:00.000Z',
            checkOutTime: '2025-01-18T18:00:00.000Z',
            hoursWorked: 9
          },
          {
            date: '2025-01-19',
            email: 'sarah.johnson@autoelite.com',
            checkInTime: '2025-01-19T09:00:00.000Z',
            checkOutTime: '2025-01-19T18:00:00.000Z',
            hoursWorked: 9
          }
        ],
        extraWork: [
          {
            description: 'Customer consultation after hours',
            hours: 1.0,
            date: '2025-01-17'
          },
          {
            description: 'Weekend service planning',
            hours: 2.0,
            date: '2025-01-19'
          }
        ]
      }
    ];

    const startDate = new Date('2025-01-15');
    const endDate = new Date('2025-01-21');
    let createdCount = 0;

    // Create staff members and salary records
    for (const staffData of sampleStaffData) {
      try {
        // Create or update staff member
        let staff = await Staff.findOne({ email: staffData.email });
        
        if (!staff) {
          staff = await Staff.create({
            name: staffData.name,
            email: staffData.email,
            password: 'password123',
            role: staffData.role,
            salary: {
              basic: 4000,
              ot: 0,
              allowance: 200,
              deductions: 0
            },
            attendance: staffData.attendance,
            jobs: [],
            extraWork: staffData.extraWork,
            suggestions: [],
            performanceScore: 85
          });
        } else {
          staff.attendance = staffData.attendance;
          staff.extraWork = staffData.extraWork;
          await staff.save();
        }

        // Create corresponding User record
        let user = await User.findOne({ email: staffData.email });
        if (!user) {
          user = await User.create({
            name: staffData.name,
            email: staffData.email,
            password: 'password123',
            role: staffData.role
          });
        }

        // Create salary record
        const salaryRecord = await createSalaryRecord(
          staffData.email,
          startDate,
          endDate,
          req.user.id
        );
        
        createdCount++;
      } catch (error) {
        console.error(`Error creating data for ${staffData.email}:`, error.message);
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Sample salary data populated successfully! Created ${createdCount} salary records.`
    });
  } catch (err) {
    console.error('Error populating sample data:', err);
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

// @desc    Create salary records for all staff members who don't have them
// @route   POST /api/finance/salaries/create-missing-records
// @access  Private (Finance Manager, Admin)
export const createMissingSalaryRecords = async (req, res) => {
  try {
    const startDate = new Date('2025-01-15');
    const endDate = new Date('2025-01-21');
    let createdCount = 0;
    let skippedCount = 0;

    // Get all staff members
    const allStaff = await Staff.find({});
    
    for (const staff of allStaff) {
      try {
        // Check if user exists
        const user = await User.findOne({ email: staff.email });
        if (!user) {
          console.log(`User not found for staff: ${staff.email}`);
          continue;
        }

        // Check if salary record already exists for this pay period
        const existingSalary = await StaffSalary.findOne({
          staffId: user._id,
          'payPeriod.startDate': startDate,
          'payPeriod.endDate': endDate
        });

        if (existingSalary) {
          console.log(`Salary record already exists for ${staff.name}`);
          skippedCount++;
          continue;
        }

        // Create salary record
        const salaryRecord = await createSalaryRecord(
          staff.email,
          startDate,
          endDate,
          req.user ? req.user.id : user._id
        );
        
        createdCount++;
        console.log(`Created salary record for ${staff.name}`);
      } catch (error) {
        console.error(`Error creating salary record for ${staff.email}:`, error.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Salary records processed successfully! Created ${createdCount} new records, skipped ${skippedCount} existing records.` 
    });
  } catch (err) {
    console.error('Error creating missing salary records:', err);
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Generate comprehensive salary report with overtime and totals
// @route   GET /api/finance/salaries/report
// @access  Private (Finance Manager, Admin)
export const generateSalaryReportController = async (req, res) => {
  try {
    const { includeOvertime = true, includeTotals = true, format = 'detailed' } = req.query;

    // Get all staff members from HR system
    const staffMembers = await Staff.find({
      role: { $in: ['staff_manager', 'staff_member', 'staff'] }
    }, 'name email salary extraWork');

    // Get current month data
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    // Process staff data
    const staffData = staffMembers.map(staff => {
      const baseSalary = staff.salary?.basic ?? 0;
      const overtimeRate = staff.salary?.ot ?? 0;

      // Calculate current month extra work hours
      const extraWorkRecords = staff.extraWork.filter(rec =>
        rec.date >= currentMonthStart && rec.date <= currentMonthEnd
      );

      const totalExtraHours = extraWorkRecords.reduce((sum, w) => sum + (w.hours || 0), 0);
      const extraWorkPay = totalExtraHours * overtimeRate;
      const totalPay = baseSalary + extraWorkPay;

      // Calculate ETF/EPF deductions
      const epfEmployeeContribution = Math.round(baseSalary * 0.08);
      const etfContribution = Math.round(baseSalary * 0.03);
      const totalDeductions = epfEmployeeContribution + etfContribution;
      const finalPay = totalPay - totalDeductions;

      return {
        name: staff.name,
        email: staff.email,
        regularPay: baseSalary,
        otRate: overtimeRate,
        overtimeHours: totalExtraHours,
        overtimePay: extraWorkPay,
        totalPay: totalPay,
        epfEmployee: epfEmployeeContribution,
        etf: etfContribution,
        totalDeductions: totalDeductions,
        finalPay: finalPay,
        payPeriod: `${currentMonthStart.toLocaleDateString()} - ${currentMonthEnd.toLocaleDateString()}`
      };
    });

    // Calculate summary statistics
    const summary = {
      totalStaff: staffData.length,
      totalPayroll: staffData.reduce((sum, staff) => sum + staff.totalPay, 0),
      totalOvertimeHours: staffData.reduce((sum, staff) => sum + staff.overtimeHours, 0),
      totalFinalPay: staffData.reduce((sum, staff) => sum + staff.finalPay, 0),
      totalDeductions: staffData.reduce((sum, staff) => sum + staff.totalDeductions, 0),
      averageSalary: staffData.length > 0 ? staffData.reduce((sum, staff) => sum + staff.totalPay, 0) / staffData.length : 0
    };

    const report = {
      summary,
      staff: staffData,
      reportId: `SR-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      parameters: {
        includeOvertime,
        includeTotals,
        format
      }
    };

    res.status(200).json({
      success: true,
      data: report
    });
  } catch (err) {
    console.error('Error generating salary report:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to generate salary report',
      error: err.message
    });
  }
};

// @desc    Generate comprehensive salary report PDF
// @route   GET /api/finance/salaries/report-pdf
// @access  Private (Finance Manager, Admin)
export const generateSalaryReportPDFController = async (req, res) => {
  try {
    const { includeOvertime = true, includeTotals = true, format = 'detailed' } = req.query;

    // Get all staff members from HR system
    const staffMembers = await Staff.find({
      role: { $in: ['staff_manager', 'staff_member', 'staff'] }
    }, 'name email salary extraWork');

    // Get current month data
    const currentMonthStart = new Date();
    currentMonthStart.setDate(1);
    currentMonthStart.setHours(0, 0, 0, 0);

    const currentMonthEnd = new Date(currentMonthStart);
    currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
    currentMonthEnd.setDate(0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    // Process staff data
    const staffData = staffMembers.map(staff => {
      const baseSalary = staff.salary?.basic ?? 0;
      const overtimeRate = staff.salary?.ot ?? 0;

      // Calculate current month extra work hours
      const extraWorkRecords = staff.extraWork.filter(rec =>
        rec.date >= currentMonthStart && rec.date <= currentMonthEnd
      );

      const totalExtraHours = extraWorkRecords.reduce((sum, w) => sum + (w.hours || 0), 0);
      const extraWorkPay = totalExtraHours * overtimeRate;
      const totalPay = baseSalary + extraWorkPay;

      // Calculate ETF/EPF deductions
      const epfEmployeeContribution = Math.round(baseSalary * 0.08);
      const etfContribution = Math.round(baseSalary * 0.03);
      const totalDeductions = epfEmployeeContribution + etfContribution;
      const finalPay = totalPay - totalDeductions;

      return {
        name: staff.name,
        email: staff.email,
        regularPay: baseSalary,
        otRate: overtimeRate,
        extraHours: totalExtraHours,
        extraWorkPay: extraWorkPay,
        totalPay: totalPay,
        epfEmployee: epfEmployeeContribution,
        etf: etfContribution,
        totalDeductions: totalDeductions,
        finalPay: finalPay
      };
    });

    // Calculate summary statistics
    const summary = {
      totalStaff: staffData.length,
      totalPayroll: staffData.reduce((sum, staff) => sum + staff.totalPay, 0),
      totalOvertimeHours: staffData.reduce((sum, staff) => sum + staff.extraHours, 0),
      totalFinalPay: staffData.reduce((sum, staff) => sum + staff.finalPay, 0),
      totalDeductions: staffData.reduce((sum, staff) => sum + staff.totalDeductions, 0),
      averageSalary: staffData.length > 0 ? staffData.reduce((sum, staff) => sum + staff.totalPay, 0) / staffData.length : 0
    };

    // Generate PDF
    const pdfBuffer = await generateStaffSalaryReportPDF(staffData, summary);

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="staff-salary-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating salary report PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate salary report PDF',
      error: error.message
    });
  }
};
