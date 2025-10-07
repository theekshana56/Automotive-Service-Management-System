// Test script to test PDF generation directly
import { generateStaffSalaryReportPDF } from './server/src/services/finance/pdfService.js';

const testPDFGeneration = async () => {
  try {
    console.log('🧪 Testing PDF generation with sample data...');

    // Create sample staff data for testing
    const staffData = [
      {
        name: 'John Smith',
        email: 'john.smith@autoelite.com',
        regularPay: 4000,
        otRate: 25,
        extraHours: 5,
        extraWorkPay: 125,
        totalPay: 4125,
        epfEmployee: 328,
        etf: 123,
        totalDeductions: 451,
        finalPay: 3674
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@autoelite.com',
        regularPay: 3500,
        otRate: 20,
        extraHours: 3,
        extraWorkPay: 60,
        totalPay: 3560,
        epfEmployee: 284,
        etf: 107,
        totalDeductions: 391,
        finalPay: 3169
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@autoelite.com',
        regularPay: 3800,
        otRate: 22,
        extraHours: 7,
        extraWorkPay: 154,
        totalPay: 3954,
        epfEmployee: 315,
        etf: 118,
        totalDeductions: 433,
        finalPay: 3521
      }
    ];

    const summary = {
      totalStaff: staffData.length,
      totalPayroll: staffData.reduce((sum, staff) => sum + staff.totalPay, 0),
      totalOvertimeHours: staffData.reduce((sum, staff) => sum + staff.extraHours, 0),
      totalFinalPay: staffData.reduce((sum, staff) => sum + staff.finalPay, 0),
      totalDeductions: staffData.reduce((sum, staff) => sum + staff.totalDeductions, 0),
      averageSalary: staffData.length > 0 ? staffData.reduce((sum, staff) => sum + staff.totalPay, 0) / staffData.length : 0
    };

    console.log('📊 Test Data Summary:');
    console.log(`   - Staff Members: ${summary.totalStaff}`);
    console.log(`   - Total Payroll: $${summary.totalPayroll}`);
    console.log(`   - Total Overtime Hours: ${summary.totalOvertimeHours}`);
    console.log(`   - Total Final Pay: $${summary.totalFinalPay}`);

    console.log('🔄 Generating PDF...');

    const pdfBuffer = await generateStaffSalaryReportPDF(staffData, summary);

    console.log(`✅ PDF generated successfully! Size: ${pdfBuffer.length} bytes`);

    // Save PDF to file
    const fs = await import('fs');
    const fileName = `test-salary-report-${new Date().toISOString().split('T')[0]}.pdf`;
    fs.writeFileSync(fileName, pdfBuffer);

    console.log(`💾 PDF saved as: ${fileName}`);

    // Also test with empty data
    console.log('🧪 Testing PDF generation with empty data...');
    const emptyPdfBuffer = await generateStaffSalaryReportPDF([], {
      totalStaff: 0,
      totalPayroll: 0,
      totalOvertimeHours: 0,
      totalFinalPay: 0,
      totalDeductions: 0,
      averageSalary: 0
    });

    console.log(`✅ Empty PDF generated successfully! Size: ${emptyPdfBuffer.length} bytes`);

    const emptyFileName = `test-empty-salary-report-${new Date().toISOString().split('T')[0]}.pdf`;
    fs.writeFileSync(emptyFileName, emptyPdfBuffer);
    console.log(`💾 Empty PDF saved as: ${emptyFileName}`);

  } catch (error) {
    console.error('❌ Error testing PDF generation:', error);
    console.error('Stack trace:', error.stack);
  }
};

// Run the test
testPDFGeneration();
