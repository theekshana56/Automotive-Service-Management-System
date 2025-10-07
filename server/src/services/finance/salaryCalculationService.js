import Staff from '../../models/staffMng/Staff.js';
import StaffSalary from '../../models/finance/StaffSalary.js';
import User from '../../models/User.js';

/**
 * Comprehensive Salary Calculation Service
 * Integrates attendance management and extra work data
 * Formula: (work hours × $80 + OT hours × $100) - ETF - EPF
 */

// Salary rates as per requirements
const REGULAR_HOURLY_RATE = 80; // $80 per hour for regular work
const OVERTIME_HOURLY_RATE = 100; // $100 per hour for overtime/extra work

// ETF/EPF rates (Sri Lankan standards)
const EPF_EMPLOYEE_RATE = 0.08; // 8% employee contribution
const EPF_EMPLOYER_RATE = 0.12; // 12% employer contribution  
const ETF_RATE = 0.03; // 3% ETF contribution

/**
 * Calculate salary for a specific staff member for a given pay period
   * @param {string} staffEmail - Staff member's email
 * @param {Date} startDate - Pay period start date
 * @param {Date} endDate - Pay period end date
 * @returns {Object} Detailed salary calculation
   */
export const calculateStaffSalary = async (staffEmail, startDate, endDate) => {
    try {
    // Find staff member
      const staff = await Staff.findOne({ email: staffEmail });
      if (!staff) {
        throw new Error(`Staff member with email ${staffEmail} not found`);
      }

    // Get attendance records for the pay period
    const attendanceRecords = staff.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // Get extra work records for the pay period
    const extraWorkRecords = staff.extraWork.filter(work => {
      const workDate = new Date(work.date);
      return workDate >= startDate && workDate <= endDate;
    });

    // Calculate total regular hours from attendance
    const totalRegularHours = attendanceRecords.reduce((sum, record) => {
      return sum + (record.hoursWorked || 0);
    }, 0);

    // Calculate total overtime hours from extra work
    const totalOvertimeHours = extraWorkRecords.reduce((sum, work) => {
      return sum + (work.hours || 0);
    }, 0);

    // Calculate gross salary components
    const regularPay = totalRegularHours * REGULAR_HOURLY_RATE;
    const overtimePay = totalOvertimeHours * OVERTIME_HOURLY_RATE;
    const grossSalary = regularPay + overtimePay;

    // Calculate deductions
    const epfEmployeeContribution = Math.round(grossSalary * EPF_EMPLOYEE_RATE);
    const epfEmployerContribution = Math.round(grossSalary * EPF_EMPLOYER_RATE);
    const etfContribution = Math.round(grossSalary * ETF_RATE);
    
    // Calculate net salary
    const totalDeductions = epfEmployeeContribution + etfContribution;
    const netSalary = grossSalary - totalDeductions;

    // Prepare detailed breakdown
    const salaryBreakdown = {
      staffInfo: {
        name: staff.name,
        email: staff.email,
        role: staff.role
      },
      payPeriod: {
        startDate,
        endDate,
        duration: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1 // days
      },
      hours: {
        regularHours: parseFloat(totalRegularHours.toFixed(2)),
        overtimeHours: parseFloat(totalOvertimeHours.toFixed(2)),
        totalHours: parseFloat((totalRegularHours + totalOvertimeHours).toFixed(2))
      },
      earnings: {
      regularPay: parseFloat(regularPay.toFixed(2)),
        overtimePay: parseFloat(overtimePay.toFixed(2)),
        grossSalary: parseFloat(grossSalary.toFixed(2))
      },
      deductions: {
        epfEmployee: epfEmployeeContribution,
        epfEmployer: epfEmployerContribution,
        etf: etfContribution,
        totalDeductions: parseFloat(totalDeductions.toFixed(2))
      },
      netSalary: parseFloat(netSalary.toFixed(2)),
      rates: {
        regularHourlyRate: REGULAR_HOURLY_RATE,
        overtimeHourlyRate: OVERTIME_HOURLY_RATE,
        epfEmployeeRate: EPF_EMPLOYEE_RATE,
        epfEmployerRate: EPF_EMPLOYER_RATE,
        etfRate: ETF_RATE
      },
      attendanceDetails: attendanceRecords.map(record => ({
        date: record.date,
        checkIn: record.checkInTime,
        checkOut: record.checkOutTime,
        hoursWorked: record.hoursWorked || 0,
        pay: (record.hoursWorked || 0) * REGULAR_HOURLY_RATE
      })),
      extraWorkDetails: extraWorkRecords.map(work => ({
        date: work.date,
        description: work.description,
        hours: work.hours || 0,
        pay: (work.hours || 0) * OVERTIME_HOURLY_RATE
      }))
    };

    return salaryBreakdown;
  } catch (error) {
    console.error('Error calculating staff salary:', error);
    throw error;
  }
};

/**
 * Create or update salary record in the database
 * @param {string} staffEmail - Staff member's email
 * @param {Date} startDate - Pay period start date
 * @param {Date} endDate - Pay period end date
 * @param {string} createdBy - User ID who created the salary record
 * @returns {Object} Created/updated salary record
 */
export const createSalaryRecord = async (staffEmail, startDate, endDate, createdBy) => {
  try {
    // Calculate salary breakdown
    const salaryBreakdown = await calculateStaffSalary(staffEmail, startDate, endDate);

    // Find staff member to get their User ID
    const staff = await Staff.findOne({ email: staffEmail });
    const user = await User.findOne({ email: staffEmail });

    if (!user) {
      throw new Error(`User record not found for ${staffEmail}`);
    }

    // Check if salary record already exists for this pay period
    const existingSalary = await StaffSalary.findOne({
      staffId: user._id,
      'payPeriod.startDate': startDate,
      'payPeriod.endDate': endDate
    });

    if (existingSalary) {
      // Update existing record
      existingSalary.regularHours = salaryBreakdown.hours.regularHours;
      existingSalary.overtimeHours = salaryBreakdown.hours.overtimeHours;
      existingSalary.hourlyRate = REGULAR_HOURLY_RATE;
      existingSalary.overtimeRate = OVERTIME_HOURLY_RATE / REGULAR_HOURLY_RATE; // 1.25x
      existingSalary.basicSalary = 0; // No basic salary in this calculation
      
      // Update calculations
      existingSalary.calculations.regularPay = salaryBreakdown.earnings.regularPay;
      existingSalary.calculations.overtimePay = salaryBreakdown.earnings.overtimePay;
      existingSalary.calculations.grossSalary = salaryBreakdown.earnings.grossSalary;
      existingSalary.calculations.epfContribution.employee = salaryBreakdown.deductions.epfEmployee;
      existingSalary.calculations.epfContribution.employer = salaryBreakdown.deductions.epfEmployer;
      existingSalary.calculations.etfContribution = salaryBreakdown.deductions.etf;
      existingSalary.calculations.totalDeductions = salaryBreakdown.deductions.totalDeductions;
      existingSalary.calculations.netSalary = salaryBreakdown.netSalary;

      await existingSalary.save();
      return existingSalary;
    } else {
      // Create new salary record
      const salaryRecord = await StaffSalary.create({
        staffId: user._id,
        staffName: salaryBreakdown.staffInfo.name,
        staffRole: salaryBreakdown.staffInfo.role,
        payPeriod: {
          startDate,
          endDate
        },
        basicSalary: 0, // No basic salary in this calculation
        hourlyRate: REGULAR_HOURLY_RATE,
        regularHours: salaryBreakdown.hours.regularHours,
        overtimeHours: salaryBreakdown.hours.overtimeHours,
        overtimeRate: OVERTIME_HOURLY_RATE / REGULAR_HOURLY_RATE, // 1.25x
        allowances: [], // No allowances in this calculation
        deductions: [
          {
            type: 'epf',
            amount: salaryBreakdown.deductions.epfEmployee,
            description: 'Employee EPF Contribution (8%)'
          },
          {
            type: 'etf',
            amount: salaryBreakdown.deductions.etf,
            description: 'ETF Contribution (3%)'
          }
        ],
        calculations: {
          regularPay: salaryBreakdown.earnings.regularPay,
          overtimePay: salaryBreakdown.earnings.overtimePay,
          totalAllowances: 0,
          totalDeductions: salaryBreakdown.deductions.totalDeductions,
          grossSalary: salaryBreakdown.earnings.grossSalary,
          netSalary: salaryBreakdown.netSalary,
          epfContribution: {
            employee: salaryBreakdown.deductions.epfEmployee,
            employer: salaryBreakdown.deductions.epfEmployer
          },
          etfContribution: salaryBreakdown.deductions.etf
        },
        status: 'draft',
        notes: `Calculated from attendance and extra work data. Regular hours: ${salaryBreakdown.hours.regularHours}h @ $${REGULAR_HOURLY_RATE}/h, Overtime hours: ${salaryBreakdown.hours.overtimeHours}h @ $${OVERTIME_HOURLY_RATE}/h`
      });

      return salaryRecord;
    }
  } catch (error) {
    console.error('Error creating salary record:', error);
    throw error;
  }
};

/**
 * Calculate salary for all staff members for a given pay period
 * @param {Date} startDate - Pay period start date
 * @param {Date} endDate - Pay period end date
 * @param {string} createdBy - User ID who initiated the calculation
 * @returns {Array} Array of salary calculations for all staff
 */
export const calculateAllStaffSalaries = async (startDate, endDate, createdBy) => {
  try {
    // Get all staff members
    const allStaff = await Staff.find({});
    const salaryCalculations = [];

    for (const staff of allStaff) {
      try {
        const salaryBreakdown = await calculateStaffSalary(staff.email, startDate, endDate);
        salaryCalculations.push(salaryBreakdown);
      } catch (error) {
        console.error(`Error calculating salary for ${staff.email}:`, error);
        // Continue with other staff members
      }
    }

    return salaryCalculations;
  } catch (error) {
    console.error('Error calculating all staff salaries:', error);
    throw error;
  }
};

/**
 * Get salary summary for dashboard
 * @param {Date} startDate - Optional start date filter
 * @param {Date} endDate - Optional end date filter
 * @returns {Object} Salary summary statistics
 */
export const getSalarySummary = async (startDate, endDate) => {
  try {
    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate || new Date();

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
          totalDeductions: { $sum: '$calculations.totalDeductions' },
          totalRegularHours: { $sum: '$regularHours' },
          totalOvertimeHours: { $sum: '$overtimeHours' }
        }
      }
    ]);

    const result = summary[0] || {
      totalSalaries: 0,
      totalNetSalary: 0,
        totalGrossSalary: 0,
        totalEPF: 0,
        totalETF: 0,
      totalDeductions: 0,
        totalRegularHours: 0,
        totalOvertimeHours: 0
    };

      return {
      ...result,
      averageSalary: result.totalSalaries > 0 ? result.totalNetSalary / result.totalSalaries : 0,
      totalHours: result.totalRegularHours + result.totalOvertimeHours
      };
    } catch (error) {
      console.error('Error getting salary summary:', error);
      throw error;
    }
};

/**
 * Generate detailed salary report for a staff member
 * @param {string} staffEmail - Staff member's email
 * @param {Date} startDate - Pay period start date
 * @param {Date} endDate - Pay period end date
 * @returns {Object} Detailed salary report
 */
export const generateSalaryReport = async (staffEmail, startDate, endDate) => {
  try {
    const salaryBreakdown = await calculateStaffSalary(staffEmail, startDate, endDate);
    
    // Add additional report data
    const report = {
      ...salaryBreakdown,
      reportGeneratedAt: new Date(),
      reportPeriod: `${startDate.toDateString()} to ${endDate.toDateString()}`,
      summary: {
        totalDays: salaryBreakdown.payPeriod.duration,
        averageHoursPerDay: salaryBreakdown.hours.totalHours / salaryBreakdown.payPeriod.duration,
        hourlyEfficiency: salaryBreakdown.hours.totalHours > 0 ? 
          (salaryBreakdown.earnings.grossSalary / salaryBreakdown.hours.totalHours) : 0
      }
    };

    return report;
  } catch (error) {
    console.error('Error generating salary report:', error);
    throw error;
  }
};
