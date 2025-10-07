import express from 'express';
import Staff from '../../models/staffMng/Staff.js';
import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import authRequired from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import { createAutoSalaryRecord, createMissingSalaryRecordsForAll } from '../../utils/autoSalaryCreation.js';

const router = express.Router();

// Helper function to create staff member with automatic salary record
const createStaffWithSalary = async (staffData, req) => {
  const staff = await Staff.create(staffData);
  console.log('Created new staff member:', staff.email);
  
  // Automatically create salary record for new staff member
  try {
    await createAutoSalaryRecord(staff.email, req.user?.id || 'system');
    console.log('Auto-created salary record for:', staff.email);
  } catch (error) {
    console.error('Error creating auto salary record:', error.message);
  }
  
  return staff;
};

// Get all staff members
router.get('/staff', async (req, res) => {
  try {
  const staff = await Staff.find({}, 'name email role jobs attendance extraWork salary suggestions');
  const enriched = await Promise.all(staff.map(async (s) => {
    const user = await User.findOne({ email: s.email }, 'phone address role createdAt');
    return {
      _id: s._id,
      userId: user?._id,
      name: s.name,
      email: s.email,
      role: s.role,
      jobs: s.jobs,
      attendance: s.attendance,
      extraWork: s.extraWork,
      salary: s.salary,
      suggestions: s.suggestions,
      phone: user?.phone,
      address: user?.address,
      createdAt: user?.createdAt
    };
  }));
  res.json({ staff: enriched });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch staff members" });
  }
});

// Get salary summary for a specific staff member by email
router.get('/salary/:email', authRequired, allowRoles('staff_manager', 'hr_manager', 'admin'), async (req, res) => {
  try {
    const email = req.params.email?.toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const baseSalary = typeof staff.salary?.basic === 'number' ? staff.salary.basic : 0;
    const overtimeRate = typeof staff.salary?.ot === 'number'
      ? staff.salary.ot
      : Math.round(((baseSalary / 160) * 1.5) * 100) / 100;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyExtraHours = (staff.extraWork || []).reduce((sum, entry) => {
      if (!entry?.date) return sum;
      const workDate = new Date(entry.date);
      if (workDate >= startOfMonth && workDate <= endOfMonth) {
        return sum + (Number(entry.hours) || 0);
      }
      return sum;
    }, 0);

    const extraWorkPay = Math.round(monthlyExtraHours * overtimeRate * 100) / 100;
    const regularPay = Math.round(baseSalary * 100) / 100;
    const totalPay = Math.round((regularPay + extraWorkPay) * 100) / 100;

    res.json({
      staff: {
        email: staff.email,
        name: staff.name,
        baseSalary: regularPay,
        overtimeRate,
        extraWorkHours: monthlyExtraHours,
        extraWorkPay
      },
      currentMonth: {
        regularPay,
        overtimeRate,
        extraWorkHours: monthlyExtraHours,
        extraWorkPay,
        totalPay
      }
    });
  } catch (error) {
    console.error('Failed to load salary summary', error);
    res.status(500).json({ message: 'Failed to load salary summary' });
  }
});

// Salary summary list for all staff
router.get('/salary', authRequired, allowRoles('staff_manager', 'hr_manager', 'admin'), async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'staff_manager') {
      query.role = 'staff_manager';
    }
    const staffDocs = await Staff.find(query, 'name email role salary extraWork');
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const summary = staffDocs.map((staff) => {
      const baseSalary = typeof staff.salary?.basic === 'number' ? staff.salary.basic : 0;
      const overtimeRate = typeof staff.salary?.ot === 'number'
        ? staff.salary.ot
        : Math.round(((baseSalary / 160) * 1.5) * 100) / 100;

      const monthlyExtraHours = (staff.extraWork || []).reduce((sum, entry) => {
        if (!entry?.date) return sum;
        const workDate = new Date(entry.date);
        if (workDate >= startOfMonth && workDate <= endOfMonth) {
          return sum + (Number(entry.hours) || 0);
        }
        return sum;
      }, 0);

      const extraWorkPay = Math.round(monthlyExtraHours * overtimeRate * 100) / 100;
      const regularPay = Math.round(baseSalary * 100) / 100;
      const totalPay = Math.round((regularPay + extraWorkPay) * 100) / 100;

      return {
        email: staff.email,
        name: staff.name,
        role: staff.role,
        baseSalary: regularPay,
        overtimeRate,
        extraWorkHours: monthlyExtraHours,
        extraWorkPay,
        totalPay
      };
    });

    res.json({ staff: summary });
  } catch (error) {
    console.error('Failed to load staff salary summaries', error);
    res.status(500).json({ message: 'Failed to load staff salary summaries' });
  }
});

// Create or get staff member by email (for testing/development)
router.post('/staff/create-or-get', async (req, res) => {
  try {
    const { email, name } = req.body;
    
    // Check if staff member already exists
    let staff = await Staff.findOne({ email });
    
    if (!staff) {
      // Create new staff member with automatic salary record
      staff = await createStaffWithSalary({
        name: name || 'Staff Member',
        email: email,
        password: 'password123', // Default password
        role: 'staff_member',
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
      }, req);
    }
    
    res.json({ 
      message: "Staff member ready", 
      staff: {
        name: staff.name,
        email: staff.email,
        role: staff.role
      }
    });
  } catch (error) {
    console.error('Error creating/getting staff member:', error);
    res.status(500).json({ error: "Failed to create/get staff member", details: error.message });
  }
});

// Get performance stats - note: mounted at both /api/staff/staff/performance-stats and /api/staff/performance-stats
router.get('/performance-stats', async (req, res) => {
  try {
    const staff = await Staff.find({}, 'name email role jobs attendance extraWork salary');

    const stats = {
      totalStaff: staff.length,
      totalJobs: staff.reduce((sum, s) => sum + s.jobs.length, 0),
      completedJobs: staff.reduce((sum, s) => sum + s.jobs.filter(j => j.status === 'Completed').length, 0),
      pendingJobs: staff.reduce((sum, s) => sum + s.jobs.filter(j => j.status === 'Pending').length, 0),
      inProgressJobs: staff.reduce((sum, s) => sum + s.jobs.filter(j => j.status === 'In Progress').length, 0),
      averagePerformance: 85 // Placeholder - can be calculated based on actual metrics
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch performance stats" });
  }
});

// Get jobs for a specific staff member
router.get('/staff-jobs/:email', async (req, res) => {
  try {
    const { email } = req.params;
    let staff = await Staff.findOne({ email });
    if (!staff) {
      console.log('Staff member not found for email:', email, '- creating new staff member');
      
      // Create new staff member automatically with salary record
      staff = await createStaffWithSalary({
        name: email.split('@')[0] || 'Staff Member',
        email: email,
        password: 'password123', // Default password
        role: 'staff_member',
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
      }, req);
    }
    res.json({ jobs: staff.jobs || [] });
  } catch (error) {
    console.error('Error fetching jobs for email:', req.params.email, error);
    res.status(500).json({ error: "Failed to fetch jobs", details: error.message });
  }
});

// Update job status
router.put('/staff-jobs/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status } = req.body;
    
    const staff = await Staff.findOne({ 'jobs._id': jobId });
    if (!staff) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    const job = staff.jobs.id(jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    
    job.status = status;
    await staff.save();
    
    res.json({ 
      message: "Job status updated successfully", 
      job: job,
      jobs: staff.jobs 
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ error: "Failed to update job status" });
  }
});

// Update job status by index (fallback method)
router.put('/staff-jobs/update-by-index', async (req, res) => {
  try {
    const { email, jobIndex, status } = req.body;
    
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }
    
    if (jobIndex < 0 || jobIndex >= staff.jobs.length) {
      return res.status(400).json({ error: "Invalid job index" });
    }
    
    staff.jobs[jobIndex].status = status;
    await staff.save();
    
    res.json({ 
      message: "Job status updated successfully", 
      job: staff.jobs[jobIndex],
      jobs: staff.jobs 
    });
  } catch (error) {
    console.error('Error updating job status by index:', error);
    res.status(500).json({ error: "Failed to update job status" });
  }
});

// Get attendance for a specific staff member
router.get('/attendance/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Fetching attendance for email:', email);
    
    let staff = await Staff.findOne({ email });
    if (!staff) {
      console.log('Staff member not found for email:', email, '- creating new staff member');
      
      // Create new staff member automatically with salary record
      staff = await createStaffWithSalary({
        name: email.split('@')[0] || 'Staff Member',
        email: email,
        password: 'password123', // Default password
        role: 'staff_member',
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
      }, req);
    }
    
    console.log('Found staff member:', staff.name, 'with attendance records:', staff.attendance?.length || 0);
    res.json({ attendance: staff.attendance || [] });
  } catch (error) {
    console.error('Error fetching attendance for email:', req.params.email, error);
    res.status(500).json({ error: "Failed to fetch attendance", details: error.message });
  }
});

// Get extra work for a specific staff member
router.get('/extrawork/:email', async (req, res) => {
  try {
    const { email } = req.params;
    let staff = await Staff.findOne({ email });
    if (!staff) {
      console.log('Staff member not found for email:', email, '- creating new staff member');
      
      // Create new staff member automatically with salary record
      staff = await createStaffWithSalary({
        name: email.split('@')[0] || 'Staff Member',
        email: email,
        password: 'password123', // Default password
        role: 'staff_member',
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
      }, req);
    }
    res.json({ extraWork: staff.extraWork || [] });
  } catch (error) {
    console.error('Error fetching extra work for email:', req.params.email, error);
    res.status(500).json({ error: "Failed to fetch extra work", details: error.message });
  }
});

// Get suggestions for a specific staff member
router.get('/suggestions/:email', async (req, res) => {
  try {
    const { email } = req.params;
    let staff = await Staff.findOne({ email });
    if (!staff) {
      console.log('Staff member not found for email:', email, '- creating new staff member');
      
      // Create new staff member automatically with salary record
      staff = await createStaffWithSalary({
        name: email.split('@')[0] || 'Staff Member',
        email: email,
        password: 'password123', // Default password
        role: 'staff_member',
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
      }, req);
    }
    res.json({ suggestions: staff.suggestions || [] });
  } catch (error) {
    console.error('Error fetching suggestions for email:', req.params.email, error);
    res.status(500).json({ error: "Failed to fetch suggestions", details: error.message });
  }
});

// Check-in by email
router.post("/attendance/checkin", async (req, res) => {
  try {
    const { email, checkInTime } = req.body;
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    
    // Check if there's already an attendance record for today
    let todayRecord = staff.attendance.find(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === today;
    });
    
    if (todayRecord) {
      // Update existing record
      todayRecord.checkInTime = checkInTime || currentTime;
      todayRecord.checkOutTime = null;
      todayRecord.hoursWorked = 0;
      todayRecord.approvalStatus = 'pending';
      todayRecord.approvedBy = undefined;
      todayRecord.approvalNote = undefined;
    } else {
      // Create new record
      staff.attendance.push({
        date: today,
        email: email,
        checkInTime: checkInTime || currentTime,
        checkOutTime: null,
        hoursWorked: 0,
        approvalStatus: 'pending'
      });
    }

    await staff.save();
    res.json({ message: "Checked in successfully", attendance: staff.attendance });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: "Failed to check in" });
  }
});

// Check-out by email
router.post("/attendance/checkout", async (req, res) => {
  try {
    const { email, checkOutTime: requestCheckOutTime, hoursWorked } = req.body;
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentTime = new Date().toISOString();
    
    // Find today's attendance record with better date matching
    const todayRecord = staff.attendance.find(record => {
      const recordDate = new Date(record.date).toISOString().split('T')[0];
      return recordDate === today;
    });
    
    if (!todayRecord) {
      return res.status(400).json({ error: "No check-in record found for today" });
    }
    
    if (!todayRecord.checkInTime) {
      return res.status(400).json({ error: "No check-in time found for today" });
    }
    
    if (todayRecord.checkOutTime) {
      return res.status(400).json({ error: "Already checked out for today" });
    }
    
    // Set checkout time
    todayRecord.checkOutTime = requestCheckOutTime || currentTime;
    
    // Calculate hours worked
    const checkInTimeDate = new Date(todayRecord.checkInTime);
    const checkOutTimeDateCalc = new Date(todayRecord.checkOutTime);
    const hoursWorkedCalculated = (checkOutTimeDateCalc - checkInTimeDate) / (1000 * 60 * 60); // Convert to hours
    
    todayRecord.hoursWorked = hoursWorked || hoursWorkedCalculated;
    // Any change to attendance should require approval again
    todayRecord.approvalStatus = 'pending';
    todayRecord.approvedBy = undefined;
    todayRecord.approvalNote = undefined;
    
    await staff.save();
    res.json({ 
      message: "Checked out successfully", 
      attendance: staff.attendance,
      hoursWorked: todayRecord.hoursWorked
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: "Failed to check out" });
  }
});

// Add extra work
router.post("/extrawork/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { description, hours, date } = req.body;

    console.log('📥 Adding extra work for:', email, { description, hours, date });

    // Validate input
    if (!description || description.trim().length === 0) {
      return res.status(400).json({ error: "Description is required" });
    }

    if (!hours || isNaN(hours) || hours <= 0) {
      return res.status(400).json({ error: "Valid hours must be provided" });
    }

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    const staff = await Staff.findOne({ email });
    if (!staff) {
      console.log('❌ Staff member not found:', email);
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Validate date is not in the future
    const extraWorkDate = new Date(date);
    if (Number.isNaN(extraWorkDate.getTime())) {
      return res.status(400).json({ error: "Invalid date provided" });
    }

    // Normalize both dates to midnight to avoid timezone-related false positives
    extraWorkDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (extraWorkDate > today) {
      return res.status(400).json({ error: "Cannot record extra work for future dates" });
    }

    staff.extraWork.push({
      description: description.trim(),
      hours: parseFloat(hours),
      date: date
    });

    await staff.save();
    console.log('✅ Extra work added successfully for:', email);
    res.json({ message: "Extra work added", extraWork: staff.extraWork });
  } catch (error) {
    console.error('❌ Failed to add extra work:', error);
    res.status(500).json({
      error: "Failed to add extra work",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add suggestion
router.post("/suggestions/:email", async (req, res) => {
  try {
    const rawEmail = req.params.email;
    const normalizedEmail = decodeURIComponent(rawEmail || '').toLowerCase();
    const suggestionText = typeof req.body?.text === 'string' ? req.body.text.trim() : '';

    if (!normalizedEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!suggestionText) {
      return res.status(400).json({ error: "Suggestion text is required" });
    }

    let staff = await Staff.findOne({ email: normalizedEmail });
    if (!staff) {
      console.log('Staff member not found for suggestion:', normalizedEmail, '- creating new staff member');
      staff = await createStaffWithSalary({
        name: normalizedEmail.split('@')[0] || 'Staff Member',
        email: normalizedEmail,
        password: 'password123',
        role: 'staff_member',
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
      }, req);
    }

    staff.suggestions.push({
      text: suggestionText,
      date: new Date()
    });
    await staff.save();

    console.log('Suggestion added for:', staff.email, 'Total suggestions:', staff.suggestions.length);
    res.json({ message: "Suggestion added", suggestions: staff.suggestions });
  } catch (error) {
    console.error('Failed to add suggestion:', error);
    res.status(500).json({ error: "Failed to add suggestion" });
  }
});

// Update job status
router.put("/jobs/update", async (req, res) => {
  try {
    const { email, jobIndex, status } = req.body;
    const staff = await Staff.findOne({ email });
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    if (staff.jobs[jobIndex]) {
      staff.jobs[jobIndex].status = status;
      await staff.save();
      res.json({ message: "Job status updated", jobs: staff.jobs });
    } else {
      res.status(404).json({ error: "Job not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update job status" });
  }
});

// Sync job from Auto Elite system
router.post("/sync-job", async (req, res) => {
  try {
    const { staffEmail, task, status, bookingId, vehiclePlate, jobType, notes } = req.body;
    const staff = await Staff.findOne({ email: staffEmail });
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    staff.jobs.push({
      task,
      status: status || 'Pending',
      bookingId,
      vehiclePlate,
      jobType,
      notes,
      assignedAt: new Date()
    });

    await staff.save();
    res.json({ message: "Job synced successfully", jobs: staff.jobs });
  } catch (error) {
    res.status(500).json({ error: "Failed to sync job" });
  }
});

// Generate attendance report as CSV
router.get('/attendance-report/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const staff = await Staff.findOne({ email });
    
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Create CSV content
    let csvContent = "Date,Check In,Check Out,Hours Worked,Status\n";
    
    staff.attendance.forEach(record => {
      const date = new Date(record.date).toLocaleDateString();
      const checkIn = record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : 'N/A';
      const checkOut = record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : 'N/A';
      const hoursWorked = record.hoursWorked || 0;
      const status = record.checkInTime && record.checkOutTime ? 'Completed' : record.checkInTime ? 'In Progress' : 'Absent';
      
      csvContent += `${date},${checkIn},${checkOut},${hoursWorked},${status}\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${email}_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate attendance report" });
  }
});



// Generate salary report as PDF/CSV
router.get('/salary-report/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const staff = await Staff.findOne({ email }, 'name email salary attendance extraWork');
    
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Calculate salary details (same logic as above)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyAttendance = staff.attendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });

    const totalHours = monthlyAttendance.reduce((sum, record) => sum + (record.hoursWorked || 0), 0);
    const extraHours = staff.extraWork.reduce((sum, work) => {
      const workDate = new Date(work.date);
      if (workDate.getMonth() === currentMonth && workDate.getFullYear() === currentYear) {
        return sum + (work.hours || 0);
      }
      return sum;
    }, 0);

    const totalHoursWorked = totalHours + extraHours;
    const baseSalary = staff.salary?.basic || staff.salary || 0;
    const hourlyRate = baseSalary / 160;
    const overtimeRate = hourlyRate * 1.5;
    
    const regularHours = Math.min(totalHours, 160);
    const overtimeHours = Math.max(0, totalHours - 160);
    const extraWorkPay = extraHours * overtimeRate;
    
    const regularPay = baseSalary;
    const overtimePay = overtimeHours * overtimeRate;
    const totalPay = regularPay + overtimePay + extraWorkPay;

    // Create CSV content
    const monthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    let csvContent = `Salary Report - ${monthName}\n`;
    csvContent += `Employee: ${staff.name} (${staff.email})\n\n`;
    csvContent += `Base Salary,${baseSalary}\n`;
    csvContent += `Hourly Rate,${hourlyRate.toFixed(2)}\n`;
    csvContent += `Overtime Rate,${overtimeRate.toFixed(2)}\n\n`;
    csvContent += `Regular Hours,${regularHours.toFixed(2)}\n`;
    csvContent += `Overtime Hours,${overtimeHours.toFixed(2)}\n`;
    csvContent += `Extra Work Hours,${extraHours.toFixed(2)}\n`;
    csvContent += `Total Hours,${totalHoursWorked.toFixed(2)}\n\n`;
    csvContent += `Regular Pay,${regularPay.toFixed(2)}\n`;
    csvContent += `Overtime Pay,${overtimePay.toFixed(2)}\n`;
    csvContent += `Extra Work Pay,${extraWorkPay.toFixed(2)}\n`;
    csvContent += `Total Pay,${totalPay.toFixed(2)}\n`;

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="salary_report_${email}_${monthName.replace(' ', '_')}.csv"`);
    res.send(csvContent);
  } catch (error) {
    res.status(500).json({ error: "Failed to generate salary report" });
  }
});

// Performance review endpoint
router.post('/staff/performance-review', async (req, res) => {
  try {
    const { staffId, score, comments, goals } = req.body;
    
    const staff = await Staff.findById(staffId);
    if (!staff) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Add performance review data to staff member
    if (!staff.performanceReviews) {
      staff.performanceReviews = [];
    }
    
    staff.performanceReviews.push({
      score: parseInt(score),
      comments: comments,
      goals: goals,
      reviewDate: new Date(),
      reviewedBy: 'Manager' // This could be enhanced to track who did the review
    });

    // Update performance score
    staff.performanceScore = parseInt(score);
    
    await staff.save();
    
    res.json({ 
      message: "Performance review submitted successfully",
      performanceScore: staff.performanceScore
    });
  } catch (error) {
    console.error('Performance review error:', error);
    res.status(500).json({ error: "Failed to submit performance review" });
  }
});

// Add sample jobs for testing (development only)
router.post('/staff/add-sample-jobs/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Adding sample jobs for email:', email);
    
    let staff = await Staff.findOne({ email });
    if (!staff) {
      console.log('Staff member not found for email:', email, '- creating new staff member');
      
      // Create new staff member automatically with salary record
      staff = await createStaffWithSalary({
        name: email.split('@')[0] || 'Staff Member',
        email: email,
        password: 'password123', // Default password
        role: 'staff_manager',
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
      }, req);
    }

    // Add sample jobs
    const sampleJobs = [
      {
        task: 'Oil Change - Toyota Camry ABC123',
        status: 'Pending',
        bookingId: 'booking-001',
        vehiclePlate: 'ABC123',
        jobType: 'Oil Change',
        notes: 'Regular maintenance - 5000km service',
        assignedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        task: 'Brake Inspection - Honda Civic XYZ789',
        status: 'In Progress',
        bookingId: 'booking-002',
        vehiclePlate: 'XYZ789',
        jobType: 'Brake Inspection',
        notes: 'Customer reported squeaking noise',
        assignedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        task: 'Engine Diagnostic - Ford Focus DEF456',
        status: 'Pending',
        bookingId: 'booking-003',
        vehiclePlate: 'DEF456',
        jobType: 'Engine Diagnostic',
        notes: 'Check engine light on',
        assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        task: 'Tire Rotation - Nissan Altima GHI789',
        status: 'Completed',
        bookingId: 'booking-004',
        vehiclePlate: 'GHI789',
        jobType: 'Tire Rotation',
        notes: 'Regular maintenance',
        assignedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        task: 'AC Service - BMW 320i JKL012',
        status: 'Pending',
        bookingId: 'booking-005',
        vehiclePlate: 'JKL012',
        jobType: 'AC Service',
        notes: 'AC not cooling properly',
        assignedAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ];

    // Add jobs to staff member
    staff.jobs.push(...sampleJobs);
    
    // Add sample extra work
    const sampleExtraWork = [
      {
        description: 'Emergency brake repair for customer',
        hours: 2.5,
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        description: 'Overtime diagnostic work',
        hours: 1.5,
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      }
    ];
    staff.extraWork.push(...sampleExtraWork);
    
    // Add sample suggestions
    const sampleSuggestions = [
      {
        text: 'We should consider upgrading our diagnostic equipment for better efficiency',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        text: 'Implement a better system for tracking parts inventory',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      }
    ];
    staff.suggestions.push(...sampleSuggestions);
    
    await staff.save();

    console.log('Added sample data:', {
      jobs: sampleJobs.length,
      extraWork: sampleExtraWork.length,
      suggestions: sampleSuggestions.length
    });
    
    res.json({ 
      message: `Added ${sampleJobs.length} sample jobs, ${sampleExtraWork.length} extra work records, and ${sampleSuggestions.length} suggestions successfully`,
      jobs: staff.jobs,
      extraWork: staff.extraWork,
      suggestions: staff.suggestions,
      totalJobs: staff.jobs.length
    });
  } catch (error) {
    console.error('Error adding sample jobs:', error);
    res.status(500).json({ error: "Failed to add sample jobs", details: error.message });
  }
});

// Create sample advisor assignments (simulating advisor-to-staff workflow)
router.post('/staff/create-advisor-assignments/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('Creating advisor assignments for email:', email);
    
    // Import required models
    const Notification = (await import('../../models/inventory/Notification.js')).default;
    const User = (await import('../../models/User.js')).default;
    
    // Find or create a staff member user
    let staffManager = await User.findOne({ role: 'staff_member' });
    if (!staffManager) {
      staffManager = await User.create({
        name: 'Staff Member',
        email: 'staff@autoelite.com',
        password: 'password123',
        role: 'staff_member'
      });
      console.log('Created staff member:', staffManager.email);
    }
    
    // Find or create an advisor user
    let advisor = await User.findOne({ role: 'advisor' });
    if (!advisor) {
      advisor = await User.create({
        name: 'Test Advisor',
        email: 'advisor@autoelite.com',
        password: 'password123',
        role: 'advisor',
        isAvailable: true,
        specializations: ['General Service', 'Oil Change', 'Diagnostics']
      });
      console.log('Created advisor:', advisor.email);
    }
    
    // Create sample advisor assignments as notifications
    const sampleAssignments = [
      {
        title: 'Job Assignment - Oil Change',
        message: 'Perform oil change service for Toyota Camry (ABC123). Customer requested synthetic oil.',
        type: 'BOOKING_ASSIGNED',
        userId: staffManager._id,
        link: '/staff-dashboard',
        meta: new Map(Object.entries({
          bookingId: 'advisor-booking-001',
          advisorId: advisor._id.toString(),
          jobType: 'Oil Change',
          vehiclePlate: 'ABC123',
          notes: 'Customer requested synthetic oil',
          estimatedCost: 120
        }))
      },
      {
        title: 'Job Assignment - Brake Service',
        message: 'Inspect and service brakes for Honda Civic (XYZ789). Customer reported squeaking noise.',
        type: 'BOOKING_ASSIGNED',
        userId: staffManager._id,
        link: '/staff-dashboard',
        meta: new Map(Object.entries({
          bookingId: 'advisor-booking-002',
          advisorId: advisor._id.toString(),
          jobType: 'Brake Service',
          vehiclePlate: 'XYZ789',
          notes: 'Customer reported squeaking noise',
          estimatedCost: 200
        }))
      },
      {
        title: 'Job Assignment - Engine Diagnostic',
        message: 'Perform engine diagnostic for Ford Focus (DEF456). Check engine light is on.',
        type: 'BOOKING_ASSIGNED',
        userId: staffManager._id,
        link: '/staff-dashboard',
        meta: new Map(Object.entries({
          bookingId: 'advisor-booking-003',
          advisorId: advisor._id.toString(),
          jobType: 'Engine Diagnostic',
          vehiclePlate: 'DEF456',
          notes: 'Check engine light is on',
          estimatedCost: 150
        }))
      }
    ];
    
    // Create notifications
    const createdNotifications = [];
    for (const assignment of sampleAssignments) {
      const notification = await Notification.create(assignment);
      createdNotifications.push(notification);
    }
    
    console.log('Created advisor assignments:', createdNotifications.length);
    
    res.json({ 
      message: `Created ${createdNotifications.length} advisor assignments successfully`,
      assignments: createdNotifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    console.error('Error creating advisor assignments:', error);
    res.status(500).json({ error: "Failed to create advisor assignments", details: error.message });
  }
});

// Create missing salary records for all staff members
router.post('/create-missing-salary-records', async (req, res) => {
  try {
    const createdCount = await createMissingSalaryRecordsForAll(req.user?.id || 'system');
    res.json({ 
      success: true, 
      message: `Created ${createdCount} missing salary records for staff members` 
    });
  } catch (error) {
    console.error('Error creating missing salary records:', error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to create missing salary records" 
    });
  }
});

export default router;
