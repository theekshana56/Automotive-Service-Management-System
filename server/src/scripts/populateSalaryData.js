/**
 * Database Population Script for Salary Management
 * This script creates sample staff data with attendance and extra work records,
 * then generates salary records to populate the salary management system.
 */

import mongoose from 'mongoose';
import Staff from '../models/staffMng/Staff.js';
import User from '../models/User.js';
import StaffSalary from '../models/finance/StaffSalary.js';
import { calculateStaffSalary, createSalaryRecord } from '../services/finance/salaryCalculationService.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/AutoElite', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample staff data with realistic attendance and extra work
const sampleStaffData = [
  {
    name: 'John Smith',
    email: 'john.smith@autoelite.com',
    role: 'mechanic',
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
  },
  {
    name: 'Mike Wilson',
    email: 'mike.wilson@autoelite.com',
    role: 'mechanic',
    attendance: [
      {
        date: '2025-01-15',
        email: 'mike.wilson@autoelite.com',
        checkInTime: '2025-01-15T07:30:00.000Z',
        checkOutTime: '2025-01-15T16:30:00.000Z',
        hoursWorked: 9
      },
      {
        date: '2025-01-16',
        email: 'mike.wilson@autoelite.com',
        checkInTime: '2025-01-16T07:30:00.000Z',
        checkOutTime: '2025-01-16T16:30:00.000Z',
        hoursWorked: 9
      },
      {
        date: '2025-01-17',
        email: 'mike.wilson@autoelite.com',
        checkInTime: '2025-01-17T07:30:00.000Z',
        checkOutTime: '2025-01-17T16:00:00.000Z',
        hoursWorked: 8.5
      },
      {
        date: '2025-01-18',
        email: 'mike.wilson@autoelite.com',
        checkInTime: '2025-01-18T07:30:00.000Z',
        checkOutTime: '2025-01-18T16:30:00.000Z',
        hoursWorked: 9
      },
      {
        date: '2025-01-19',
        email: 'mike.wilson@autoelite.com',
        checkInTime: '2025-01-19T07:30:00.000Z',
        checkOutTime: '2025-01-19T16:30:00.000Z',
        hoursWorked: 9
      }
    ],
    extraWork: [
      {
        description: 'Engine overhaul project',
        hours: 4.0,
        date: '2025-01-16'
      },
      {
        description: 'Equipment maintenance',
        hours: 1.5,
        date: '2025-01-18'
      }
    ]
  }
];

// Create or update staff members with sample data
const createStaffWithData = async () => {
  console.log('\n=== Creating Staff Members with Sample Data ===');
  
  for (const staffData of sampleStaffData) {
    try {
      // Check if staff member exists
      let staff = await Staff.findOne({ email: staffData.email });
      
      if (!staff) {
        // Create new staff member
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
        console.log(`✅ Created staff member: ${staff.name} (${staff.email})`);
      } else {
        // Update existing staff member with sample data
        staff.attendance = staffData.attendance;
        staff.extraWork = staffData.extraWork;
        await staff.save();
        console.log(`✅ Updated staff member: ${staff.name} (${staff.email})`);
      }

      // Create corresponding User record if it doesn't exist
      let user = await User.findOne({ email: staffData.email });
      if (!user) {
        user = await User.create({
          name: staffData.name,
          email: staffData.email,
          password: 'password123',
          role: staffData.role
        });
        console.log(`✅ Created user record: ${user.name} (${user.email})`);
      }
      
    } catch (error) {
      console.error(`❌ Error creating/updating staff member ${staffData.email}:`, error.message);
    }
  }
};

// Create salary records for all staff members
const createSalaryRecords = async () => {
  console.log('\n=== Creating Salary Records ===');
  
  const startDate = new Date('2025-01-15');
  const endDate = new Date('2025-01-21');
  
  for (const staffData of sampleStaffData) {
    try {
      // Calculate salary breakdown
      const salaryBreakdown = await calculateStaffSalary(staffData.email, startDate, endDate);
      
      console.log(`\n--- Salary Calculation for ${staffData.name} ---`);
      console.log(`Regular Hours: ${salaryBreakdown.hours.regularHours}h`);
      console.log(`Overtime Hours: ${salaryBreakdown.hours.overtimeHours}h`);
      console.log(`Gross Salary: $${salaryBreakdown.earnings.grossSalary.toFixed(2)}`);
      console.log(`Net Salary: $${salaryBreakdown.netSalary.toFixed(2)}`);
      
      // Create salary record
      const salaryRecord = await createSalaryRecord(
        staffData.email,
        startDate,
        endDate,
        'system-generated'
      );
      
      console.log(`✅ Created salary record for ${staffData.name}: $${salaryRecord.calculations.netSalary.toFixed(2)}`);
      
    } catch (error) {
      console.error(`❌ Error creating salary record for ${staffData.email}:`, error.message);
    }
  }
};

// Verify database population
const verifyData = async () => {
  console.log('\n=== Verifying Database Population ===');
  
  try {
    // Count staff members
    const staffCount = await Staff.countDocuments();
    console.log(`📊 Total staff members: ${staffCount}`);
    
    // Count salary records
    const salaryCount = await StaffSalary.countDocuments();
    console.log(`📊 Total salary records: ${salaryCount}`);
    
    // Show salary summary
    const salaries = await StaffSalary.find({}).populate('staffId', 'name email');
    console.log('\n--- Salary Records Summary ---');
    salaries.forEach(salary => {
      console.log(`${salary.staffName}: $${salary.calculations.netSalary.toFixed(2)} (${salary.status})`);
    });
    
    // Calculate totals
    const totalNetSalary = salaries.reduce((sum, salary) => sum + salary.calculations.netSalary, 0);
    const totalGrossSalary = salaries.reduce((sum, salary) => sum + salary.calculations.grossSalary, 0);
    const totalEPF = salaries.reduce((sum, salary) => sum + salary.calculations.epfContribution.employer, 0);
    const totalETF = salaries.reduce((sum, salary) => sum + salary.calculations.etfContribution, 0);
    
    console.log('\n--- Financial Summary ---');
    console.log(`Total Net Salary: $${totalNetSalary.toFixed(2)}`);
    console.log(`Total Gross Salary: $${totalGrossSalary.toFixed(2)}`);
    console.log(`Total EPF Contributions: $${totalEPF.toFixed(2)}`);
    console.log(`Total ETF Contributions: $${totalETF.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error verifying data:', error.message);
  }
};

// Main function
const populateDatabase = async () => {
  try {
    await connectDB();
    
    await createStaffWithData();
    await createSalaryRecords();
    await verifyData();
    
    console.log('\n🎉 Database population completed successfully!');
    console.log('You can now view salary records in the finance management system.');
    
  } catch (error) {
    console.error('❌ Database population failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateDatabase();
}

export { populateDatabase, createStaffWithData, createSalaryRecords };
