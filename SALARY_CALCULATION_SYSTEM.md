# Comprehensive Salary Calculation System

## Overview

This system integrates attendance management and extra work data to automatically calculate staff salaries with ETF/EPF deductions according to the specified formula:

**Formula: (Work Hours × $80 + OT Hours × $100) - ETF - EPF**

## System Architecture

### Backend Components

#### 1. Salary Calculation Service (`server/src/services/finance/salaryCalculationService.js`)

**Core Functions:**
- `calculateStaffSalary()` - Calculates salary for a specific staff member
- `createSalaryRecord()` - Creates/updates salary record in database
- `calculateAllStaffSalaries()` - Calculates salaries for all staff members
- `getSalarySummary()` - Provides comprehensive salary statistics
- `generateSalaryReport()` - Generates detailed salary reports

**Key Features:**
- Integrates attendance management data
- Processes extra work hours
- Applies ETF/EPF deductions automatically
- Provides detailed breakdown of calculations

#### 2. Enhanced Salary Controller (`server/src/controllers/finance/salaryController.js`)

**New Endpoints:**
- `POST /api/finance/salaries/calculate` - Calculate salary from attendance data
- `POST /api/finance/salaries/create-from-attendance` - Create salary record from attendance
- `POST /api/finance/salaries/calculate-all` - Calculate all staff salaries
- `GET /api/finance/salaries/comprehensive-summary` - Get comprehensive summary
- `GET /api/finance/salaries/report/:staffEmail` - Generate detailed report

#### 3. Updated Salary Routes (`server/src/routes/finance/salaryRoutes.js`)

All new endpoints are properly routed with authentication and authorization.

### Frontend Components

#### 1. Comprehensive Salary Calculator (`client/src/pages/finance/ComprehensiveSalaryCalculator.jsx`)

**Features:**
- Interactive salary calculation interface
- Real-time calculation results
- Detailed breakdown display
- Attendance and extra work details
- Report generation
- Bulk calculation for all staff

#### 2. Enhanced Staff Salary Management (`client/src/pages/finance/StaffSalaryManagement.jsx`)

**New Features:**
- "Calculate from Attendance" button
- Integration with comprehensive calculator
- Enhanced summary display

#### 3. Updated Finance Service (`client/src/api/finance/financeService.js`)

**New API Functions:**
- `calculateSalaryFromAttendance()`
- `createSalaryFromAttendance()`
- `calculateAllSalariesFromAttendance()`
- `getComprehensiveSalarySummary()`
- `generateDetailedSalaryReport()`

## Salary Calculation Details

### Rate Structure
- **Regular Work Hours**: $80 per hour
- **Overtime/Extra Work Hours**: $100 per hour

### Deduction Structure
- **EPF (Employee Provident Fund)**: 8% of gross salary
- **ETF (Employee Trust Fund)**: 3% of gross salary
- **Total Deductions**: 11% of gross salary

### Calculation Process

1. **Data Collection**:
   - Regular hours from attendance management system
   - Overtime hours from extra work records
   - Pay period dates

2. **Earnings Calculation**:
   ```
   Regular Pay = Regular Hours × $80
   Overtime Pay = Overtime Hours × $100
   Gross Salary = Regular Pay + Overtime Pay
   ```

3. **Deduction Calculation**:
   ```
   EPF Employee = Gross Salary × 8%
   EPF Employer = Gross Salary × 12%
   ETF = Gross Salary × 3%
   Total Deductions = EPF Employee + ETF
   ```

4. **Net Salary Calculation**:
   ```
   Net Salary = Gross Salary - Total Deductions
   ```

## Data Integration

### Attendance Management Integration

The system pulls work hours from the `Staff` model's `attendance` array:

```javascript
// Example attendance record
{
  date: "2025-01-21",
  email: "staff@autoelite.com",
  checkInTime: "2025-01-21T09:00:00.000Z",
  checkOutTime: "2025-01-21T17:30:00.000Z",
  hoursWorked: 8.5
}
```

### Extra Work Integration

The system pulls overtime hours from the `Staff` model's `extraWork` array:

```javascript
// Example extra work record
{
  description: "Emergency brake repair",
  hours: 2.5,
  date: "2025-01-20T00:00:00.000Z"
}
```

## Usage Examples

### 1. Calculate Individual Salary

```javascript
// Frontend usage
const response = await calculateSalaryFromAttendance({
  staffEmail: 'staff@autoelite.com',
  startDate: '2025-01-15',
  endDate: '2025-01-21'
});

const salaryBreakdown = response.data.data;
console.log('Net Salary:', salaryBreakdown.netSalary);
```

### 2. Create Salary Record

```javascript
// Frontend usage
const response = await createSalaryFromAttendance({
  staffEmail: 'staff@autoelite.com',
  startDate: '2025-01-15',
  endDate: '2025-01-21'
});

const salaryRecord = response.data.data;
console.log('Salary Record ID:', salaryRecord._id);
```

### 3. Calculate All Staff Salaries

```javascript
// Frontend usage
const response = await calculateAllSalariesFromAttendance({
  startDate: '2025-01-15',
  endDate: '2025-01-21'
});

const allSalaries = response.data.data;
console.log('Total staff calculated:', response.data.count);
```

## Sample Calculation

### Input Data
- **Staff Member**: John Doe (john@autoelite.com)
- **Pay Period**: January 15-21, 2025
- **Regular Hours**: 40 hours (from attendance)
- **Overtime Hours**: 7 hours (from extra work)

### Calculation Process

1. **Earnings**:
   ```
   Regular Pay = 40 × $80 = $3,200
   Overtime Pay = 7 × $100 = $700
   Gross Salary = $3,200 + $700 = $3,900
   ```

2. **Deductions**:
   ```
   EPF Employee = $3,900 × 8% = $312
   EPF Employer = $3,900 × 12% = $468
   ETF = $3,900 × 3% = $117
   Total Deductions = $312 + $117 = $429
   ```

3. **Net Salary**:
   ```
   Net Salary = $3,900 - $429 = $3,471
   ```

### Final Result
- **Gross Salary**: $3,900.00
- **Total Deductions**: $429.00
- **Net Salary**: $3,471.00

## Testing

### Test Script
Run the test script to verify calculations:

```bash
cd server
node src/tests/salaryCalculationTest.js
```

### Test Coverage
- ✅ Salary calculation accuracy
- ✅ ETF/EPF deduction application
- ✅ Data integration from attendance and extra work
- ✅ Salary record creation
- ✅ Manual verification of formulas

## API Endpoints

### Calculate Salary
```
POST /api/finance/salaries/calculate
Content-Type: application/json

{
  "staffEmail": "staff@autoelite.com",
  "startDate": "2025-01-15",
  "endDate": "2025-01-21"
}
```

### Create Salary Record
```
POST /api/finance/salaries/create-from-attendance
Content-Type: application/json

{
  "staffEmail": "staff@autoelite.com",
  "startDate": "2025-01-15",
  "endDate": "2025-01-21"
}
```

### Calculate All Salaries
```
POST /api/finance/salaries/calculate-all
Content-Type: application/json

{
  "startDate": "2025-01-15",
  "endDate": "2025-01-21"
}
```

### Get Comprehensive Summary
```
GET /api/finance/salaries/comprehensive-summary?startDate=2025-01-15&endDate=2025-01-21
```

### Generate Detailed Report
```
GET /api/finance/salaries/report/staff@autoelite.com?startDate=2025-01-15&endDate=2025-01-21
```

## Security & Authorization

- All endpoints require authentication
- Only Finance Managers and Admins can access salary calculations
- Proper validation of input data
- Secure handling of sensitive salary information

## Error Handling

- Comprehensive error messages
- Validation of required fields
- Graceful handling of missing data
- Proper HTTP status codes

## Future Enhancements

1. **Automated Payroll Processing**: Schedule automatic salary calculations
2. **Email Notifications**: Send salary notifications to staff
3. **Export Functionality**: Export salary reports to PDF/Excel
4. **Historical Analysis**: Track salary trends over time
5. **Performance Metrics**: Analyze productivity vs. compensation

## Troubleshooting

### Common Issues

1. **Missing Attendance Data**: Ensure staff members have proper attendance records
2. **Invalid Date Ranges**: Check that start and end dates are valid
3. **Calculation Errors**: Verify ETF/EPF rates are correctly applied
4. **Permission Issues**: Ensure user has proper finance manager/admin role

### Debug Steps

1. Check staff member exists in database
2. Verify attendance and extra work data
3. Validate date ranges
4. Review calculation logs
5. Test with sample data

## Support

For technical support or questions about the salary calculation system, contact the development team or refer to the API documentation.
