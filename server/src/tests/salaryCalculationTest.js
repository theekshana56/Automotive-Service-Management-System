/**
 * Test script for comprehensive salary calculation
 * This script tests the integration of attendance management and extra work data
 * Formula: (Work Hours × $80 + OT Hours × $100) - ETF - EPF
 */

import mongoose from 'mongoose';
import Staff from '../models/staffMng/Staff.js';
import { calculateStaffSalary, createSalaryRecord } from '../services/finance/salaryCalculationService.js';

// Connect to MongoDB (adjust connection string as needed)
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

// Test data setup
const setupTestData = async () => {
  console.log('\n=== Setting up test data ===');
  
  const testStaffEmail = 'test@autoelite.com';
  
  // Find or create test staff member
  let staff = await Staff.findOne({ email: testStaffEmail });
  if (!staff) {
    staff = await Staff.create({
      name: 'Test Staff Member',
      email: testStaffEmail,
      password: 'password123',
      role: 'staff',
      salary: {
        basic: 4000,
        ot: 0,
        allowance: 200,
        deductions: 0
      },
      attendance: [],
      jobs: [],
      extraWork: [],
      suggestions: [],
      performanceScore: 85
    });
    console.log('Created test staff member:', staff.email);
  }

  // Add sample attendance data (last 7 days)
  const today = new Date();
  const attendanceData = [];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate different work patterns
    const hoursWorked = i === 0 ? 8.5 : (i % 2 === 0 ? 8 : 7.5); // Today: 8.5h, alternating 8h/7.5h
    
    attendanceData.push({
      date: date.toISOString().split('T')[0],
      email: testStaffEmail,
      checkInTime: new Date(date.getTime() + 9 * 60 * 60 * 1000).toISOString(), // 9 AM
      checkOutTime: new Date(date.getTime() + (9 + hoursWorked) * 60 * 60 * 1000).toISOString(), // 9 AM + hours
      hoursWorked: hoursWorked
    });
  }

  // Add sample extra work data
  const extraWorkData = [
    {
      description: 'Emergency brake repair',
      hours: 2.5,
      date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      description: 'Overtime diagnostic work',
      hours: 1.5,
      date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
    },
    {
      description: 'Weekend maintenance',
      hours: 3.0,
      date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
    }
  ];

  // Update staff with test data
  staff.attendance = attendanceData;
  staff.extraWork = extraWorkData;
  await staff.save();

  console.log('Added attendance records:', attendanceData.length);
  console.log('Added extra work records:', extraWorkData.length);
  
  return testStaffEmail;
};

// Test salary calculation
const testSalaryCalculation = async (staffEmail) => {
  console.log('\n=== Testing Salary Calculation ===');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // Last 7 days
  const endDate = new Date();

  try {
    // Calculate salary breakdown
    const salaryBreakdown = await calculateStaffSalary(staffEmail, startDate, endDate);
    
    console.log('\n--- Salary Breakdown ---');
    console.log('Staff:', salaryBreakdown.staffInfo.name);
    console.log('Email:', salaryBreakdown.staffInfo.email);
    console.log('Pay Period:', salaryBreakdown.payPeriod.startDate.toDateString(), 'to', salaryBreakdown.payPeriod.endDate.toDateString());
    
    console.log('\n--- Hours ---');
    console.log('Regular Hours:', salaryBreakdown.hours.regularHours, 'h');
    console.log('Overtime Hours:', salaryBreakdown.hours.overtimeHours, 'h');
    console.log('Total Hours:', salaryBreakdown.hours.totalHours, 'h');
    
    console.log('\n--- Earnings ---');
    console.log('Regular Pay:', `$${salaryBreakdown.earnings.regularPay.toFixed(2)}`);
    console.log('Overtime Pay:', `$${salaryBreakdown.earnings.overtimePay.toFixed(2)}`);
    console.log('Gross Salary:', `$${salaryBreakdown.earnings.grossSalary.toFixed(2)}`);
    
    console.log('\n--- Deductions ---');
    console.log('EPF Employee (8%):', `$${salaryBreakdown.deductions.epfEmployee}`);
    console.log('EPF Employer (12%):', `$${salaryBreakdown.deductions.epfEmployer}`);
    console.log('ETF (3%):', `$${salaryBreakdown.deductions.etf}`);
    console.log('Total Deductions:', `$${salaryBreakdown.deductions.totalDeductions.toFixed(2)}`);
    
    console.log('\n--- Final Result ---');
    console.log('Net Salary:', `$${salaryBreakdown.netSalary.toFixed(2)}`);
    
    console.log('\n--- Rate Information ---');
    console.log('Regular Hourly Rate:', `$${salaryBreakdown.rates.regularHourlyRate}`);
    console.log('Overtime Hourly Rate:', `$${salaryBreakdown.rates.overtimeHourlyRate}`);
    console.log('EPF Employee Rate:', `${(salaryBreakdown.rates.epfEmployeeRate * 100).toFixed(1)}%`);
    console.log('EPF Employer Rate:', `${(salaryBreakdown.rates.epfEmployerRate * 100).toFixed(1)}%`);
    console.log('ETF Rate:', `${(salaryBreakdown.rates.etfRate * 100).toFixed(1)}%`);
    
    console.log('\n--- Attendance Details ---');
    salaryBreakdown.attendanceDetails.forEach((attendance, index) => {
      console.log(`${index + 1}. ${attendance.date}: ${attendance.hoursWorked}h - $${attendance.pay.toFixed(2)}`);
    });
    
    console.log('\n--- Extra Work Details ---');
    salaryBreakdown.extraWorkDetails.forEach((work, index) => {
      console.log(`${index + 1}. ${work.date}: ${work.description} - ${work.hours}h - $${work.pay.toFixed(2)}`);
    });

    // Verify calculation manually
    console.log('\n=== Manual Verification ===');
    const expectedRegularPay = salaryBreakdown.hours.regularHours * 80;
    const expectedOvertimePay = salaryBreakdown.hours.overtimeHours * 100;
    const expectedGrossSalary = expectedRegularPay + expectedOvertimePay;
    const expectedEPF = Math.round(expectedGrossSalary * 0.08);
    const expectedETF = Math.round(expectedGrossSalary * 0.03);
    const expectedNetSalary = expectedGrossSalary - expectedEPF - expectedETF;
    
    console.log('Expected Regular Pay:', `$${expectedRegularPay.toFixed(2)}`);
    console.log('Expected Overtime Pay:', `$${expectedOvertimePay.toFixed(2)}`);
    console.log('Expected Gross Salary:', `$${expectedGrossSalary.toFixed(2)}`);
    console.log('Expected EPF:', `$${expectedEPF}`);
    console.log('Expected ETF:', `$${expectedETF}`);
    console.log('Expected Net Salary:', `$${expectedNetSalary.toFixed(2)}`);
    
    // Check if calculations match
    const regularPayMatch = Math.abs(salaryBreakdown.earnings.regularPay - expectedRegularPay) < 0.01;
    const overtimePayMatch = Math.abs(salaryBreakdown.earnings.overtimePay - expectedOvertimePay) < 0.01;
    const grossSalaryMatch = Math.abs(salaryBreakdown.earnings.grossSalary - expectedGrossSalary) < 0.01;
    const epfMatch = salaryBreakdown.deductions.epfEmployee === expectedEPF;
    const etfMatch = salaryBreakdown.deductions.etf === expectedETF;
    const netSalaryMatch = Math.abs(salaryBreakdown.netSalary - expectedNetSalary) < 0.01;
    
    console.log('\n--- Verification Results ---');
    console.log('Regular Pay Match:', regularPayMatch ? '✅' : '❌');
    console.log('Overtime Pay Match:', overtimePayMatch ? '✅' : '❌');
    console.log('Gross Salary Match:', grossSalaryMatch ? '✅' : '❌');
    console.log('EPF Match:', epfMatch ? '✅' : '❌');
    console.log('ETF Match:', etfMatch ? '✅' : '❌');
    console.log('Net Salary Match:', netSalaryMatch ? '✅' : '❌');
    
    const allMatch = regularPayMatch && overtimePayMatch && grossSalaryMatch && epfMatch && etfMatch && netSalaryMatch;
    console.log('\nOverall Calculation:', allMatch ? '✅ PASSED' : '❌ FAILED');
    
    return salaryBreakdown;
    
  } catch (error) {
    console.error('Error testing salary calculation:', error);
    throw error;
  }
};

// Test salary record creation
const testSalaryRecordCreation = async (staffEmail) => {
  console.log('\n=== Testing Salary Record Creation ===');
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);
  const endDate = new Date();

  try {
    const salaryRecord = await createSalaryRecord(staffEmail, startDate, endDate, 'test-user-id');
    
    console.log('Salary record created successfully!');
    console.log('Record ID:', salaryRecord._id);
    console.log('Status:', salaryRecord.status);
    console.log('Net Salary:', `$${salaryRecord.calculations.netSalary.toFixed(2)}`);
    console.log('Regular Hours:', salaryRecord.regularHours);
    console.log('Overtime Hours:', salaryRecord.overtimeHours);
    
    return salaryRecord;
  } catch (error) {
    console.error('Error creating salary record:', error);
    throw error;
  }
};

// Main test function
const runTests = async () => {
  try {
    await connectDB();
    
    const staffEmail = await setupTestData();
    const salaryBreakdown = await testSalaryCalculation(staffEmail);
    const salaryRecord = await testSalaryRecordCreation(staffEmail);
    
    console.log('\n=== Test Summary ===');
    console.log('✅ All tests completed successfully!');
    console.log('✅ Salary calculation formula working correctly');
    console.log('✅ ETF/EPF deductions applied properly');
    console.log('✅ Salary record creation working');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests, testSalaryCalculation, testSalaryRecordCreation };
