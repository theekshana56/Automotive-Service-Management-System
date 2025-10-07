import StaffSalary from '../models/finance/StaffSalary.js';
import User from '../models/User.js';
import { createSalaryRecord } from '../services/finance/salaryCalculationService.js';

/**
 * Automatically creates a salary record for a staff member
 * @param {string} staffEmail - Email of the staff member
 * @param {string} createdBy - ID of the user who created the staff member
 */
export const createAutoSalaryRecord = async (staffEmail, createdBy) => {
  try {
    // Check if user exists
    const user = await User.findOne({ email: staffEmail });
    if (!user) {
      console.log(`User not found for staff: ${staffEmail}`);
      return null;
    }

    // Check if salary record already exists for current pay period
    const startDate = new Date('2025-01-15');
    const endDate = new Date('2025-01-21');
    
    const existingSalary = await StaffSalary.findOne({
      staffId: user._id,
      'payPeriod.startDate': startDate,
      'payPeriod.endDate': endDate
    });

    if (existingSalary) {
      console.log(`Salary record already exists for ${staffEmail}`);
      return existingSalary;
    }

    // Create salary record
    const salaryRecord = await createSalaryRecord(
      staffEmail,
      startDate,
      endDate,
      createdBy
    );
    
    console.log(`Auto-created salary record for ${staffEmail}`);
    return salaryRecord;
  } catch (error) {
    console.error(`Error creating auto salary record for ${staffEmail}:`, error.message);
    return null;
  }
};

/**
 * Creates salary records for all staff members who don't have them
 * @param {string} createdBy - ID of the user who triggered the creation
 */
export const createMissingSalaryRecordsForAll = async (createdBy) => {
  try {
    const Staff = (await import('../models/staffMng/Staff.js')).default;
    const allStaff = await Staff.find({});
    let createdCount = 0;
    
    for (const staff of allStaff) {
      const result = await createAutoSalaryRecord(staff.email, createdBy);
      if (result) {
        createdCount++;
      }
    }
    
    console.log(`Auto-created ${createdCount} salary records`);
    return createdCount;
  } catch (error) {
    console.error('Error creating missing salary records:', error.message);
    return 0;
  }
};
