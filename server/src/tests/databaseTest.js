/**
 * Database Connection and Salary Record Test
 * This script tests database connectivity and salary record creation
 */

import mongoose from 'mongoose';
import Staff from '../models/staffMng/Staff.js';
import User from '../models/User.js';
import StaffSalary from '../models/finance/StaffSalary.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/AutoElite', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

// Test database operations
const testDatabaseOperations = async () => {
  console.log('\n=== Testing Database Operations ===');
  
  try {
    // Test 1: Check if collections exist
    console.log('\n1. Checking collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
    // Test 2: Count existing records
    console.log('\n2. Counting existing records...');
    const staffCount = await Staff.countDocuments();
    const userCount = await User.countDocuments();
    const salaryCount = await StaffSalary.countDocuments();
    
    console.log(`Staff records: ${staffCount}`);
    console.log(`User records: ${userCount}`);
    console.log(`Salary records: ${salaryCount}`);
    
    // Test 3: Check if we have any staff members
    console.log('\n3. Checking staff members...');
    const staffMembers = await Staff.find({}).limit(5);
    console.log('Sample staff members:');
    staffMembers.forEach(staff => {
      console.log(`- ${staff.name} (${staff.email}) - Role: ${staff.role}`);
      console.log(`  Attendance records: ${staff.attendance?.length || 0}`);
      console.log(`  Extra work records: ${staff.extraWork?.length || 0}`);
    });
    
    // Test 4: Check if we have any users
    console.log('\n4. Checking users...');
    const users = await User.find({}).limit(5);
    console.log('Sample users:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // Test 5: Try to create a simple salary record
    console.log('\n5. Testing salary record creation...');
    if (staffMembers.length > 0 && users.length > 0) {
      const testStaff = staffMembers[0];
      const testUser = users.find(u => u.email === testStaff.email) || users[0];
      
      console.log(`Testing with staff: ${testStaff.name} (${testStaff.email})`);
      console.log(`Testing with user: ${testUser.name} (${testUser.email})`);
      
      // Create a test salary record
      const testSalaryData = {
        staffId: testUser._id,
        staffName: testStaff.name,
        staffRole: testStaff.role,
        payPeriod: {
          startDate: new Date('2025-01-15'),
          endDate: new Date('2025-01-21')
        },
        basicSalary: 0,
        hourlyRate: 80,
        regularHours: 40,
        overtimeHours: 5,
        overtimeRate: 1.25,
        allowances: [],
        deductions: [
          {
            type: 'epf',
            amount: 320,
            description: 'Employee EPF Contribution (8%)'
          },
          {
            type: 'etf',
            amount: 120,
            description: 'ETF Contribution (3%)'
          }
        ],
        calculations: {
          regularPay: 3200,
          overtimePay: 500,
          totalAllowances: 0,
          totalDeductions: 440,
          grossSalary: 3700,
          netSalary: 3260,
          epfContribution: {
            employee: 320,
            employer: 480
          },
          etfContribution: 120
        },
        status: 'draft',
        notes: 'Test salary record'
      };
      
      try {
        const testSalary = await StaffSalary.create(testSalaryData);
        console.log(`✅ Test salary record created successfully: ${testSalary._id}`);
        console.log(`   Net Salary: $${testSalary.calculations.netSalary}`);
        
        // Clean up test record
        await StaffSalary.findByIdAndDelete(testSalary._id);
        console.log('✅ Test salary record cleaned up');
        
      } catch (salaryError) {
        console.error('❌ Error creating test salary record:', salaryError.message);
        console.error('Salary error details:', salaryError);
      }
    } else {
      console.log('❌ No staff members or users found for testing');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error during database operations:', error);
    return false;
  }
};

// Main test function
const runDatabaseTest = async () => {
  console.log('🔍 Starting Database Connection and Salary Record Test...\n');
  
  const connected = await connectDB();
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    return;
  }
  
  const success = await testDatabaseOperations();
  
  if (success) {
    console.log('\n✅ Database test completed successfully!');
  } else {
    console.log('\n❌ Database test failed!');
  }
  
  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
};

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDatabaseTest();
}

export { runDatabaseTest };
