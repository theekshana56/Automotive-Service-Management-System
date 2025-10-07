import express from 'express';
import authRequired from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import User from '../../models/User.js';
import Staff from '../../models/staffMng/Staff.js';
import { sendMail } from '../../utils/email.js';
import { notifyUserEmail, emitToUser, emitToRole } from '../../services/notificationService.js';

const router = express.Router();

async function buildSalaryBroadcast(email) {
  try {
    const normalizedEmail = email.toLowerCase();
    const staff = await Staff.findOne({ email: normalizedEmail });
    if (!staff) return {};
    const baseSalary = typeof staff.salary?.basic === 'number' ? staff.salary.basic : 0;
    const overtimeRate = typeof staff.salary?.ot === 'number' ? staff.salary.ot : 0;
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const extraWorkHours = (staff.extraWork || []).reduce((sum, item) => {
      if (!item?.date) return sum;
      const d = new Date(item.date);
      if (d >= start && d <= end) {
        return sum + (Number(item.hours) || 0);
      }
      return sum;
    }, 0);
    const extraWorkPay = Math.round(extraWorkHours * overtimeRate * 100) / 100;
    const totalPay = Math.round((baseSalary + extraWorkPay) * 100) / 100;
    const payload = {
      name: staff.name,
      baseSalary,
      regularPay: baseSalary,
      overtimeRate,
      extraWorkHours,
      extraWorkPay,
      totalPay
    };
    console.log('Building salary broadcast for', email, ':', payload);
    return payload;
  } catch (error) {
    console.error('Failed to build salary broadcast payload', error);
    return {};
  }
}

// HR: Add staff member (creates app User and Staff profile, reuses hashing from User model)
router.post('/staff', authRequired, allowRoles('hr_manager', 'admin'), async (req, res) => {
  try {
    let { name, email, password, role = 'staff_manager', department, permissions, baseSalary, phone, address } = req.body;
    const allowedRoles = ['staff_manager', 'staff_member'];
    if (!allowedRoles.includes(role)) role = 'staff_manager';

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email, password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const appUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department,
      permissions,
      phone,
      address
    });

    // Ensure Staff profile exists/created
    const staff = await Staff.create({
      name,
      email: appUser.email,
      password, // Staff schema stores raw; keep for compatibility with existing routes
      role: role === 'staff_manager' ? 'staff_manager' : 'staff_member',
      salary: {
        basic: typeof baseSalary === 'number' ? baseSalary : 4000,
        ot: 0,
        allowance: 200,
        deductions: 0
      }
    });

    console.log(`Created staff profile for ${appUser.email} with role: ${staff.role} and salary: ${staff.salary.basic}`);

    res.status(201).json({
      message: 'Staff member created',
      user: { id: appUser._id, name: appUser.name, email: appUser.email, role: appUser.role, phone: appUser.phone, address: appUser.address },
      staff: { id: staff._id, email: staff.email }
    });

    try {
    const staffEmail = staff.email?.trim().toLowerCase();
    const hrBroadcast = await buildSalaryBroadcast(staffEmail);
    emitToRole('staff_manager', 'hr:update', { type: 'pay', email: staffEmail, ...hrBroadcast });
    } catch (_) {}
  } catch (error) {
    console.error('HR add staff error:', error);
    res.status(500).json({ message: 'Failed to add staff member' });
  }
});

// HR: Set overtime (extra work) hourly rate for a staff member
router.patch('/staff/:email/overtime-rate', authRequired, allowRoles('hr_manager', 'admin'), async (req, res) => {
  try {
    const { email } = req.params;
    const { rate } = req.body;
    if (typeof rate !== 'number' || rate < 0) {
      return res.status(400).json({ message: 'rate must be a non-negative number' });
    }
    const staff = await Staff.findOne({ email: email.toLowerCase() });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    staff.salary = staff.salary || {};
    staff.salary.ot = rate;
    await staff.save();
    const staffEmail = staff.email?.trim().toLowerCase();
    const payload = { email: staffEmail, type: 'ot', overtimeRate: staff.salary.ot };
    const hrBroadcast = await buildSalaryBroadcast(staffEmail);
    notifyUserEmail(staffEmail, 'compensation:update', payload);
    emitToUser(staffEmail, 'compensation:update', payload);
    emitToRole('staff_manager', 'hr:update', { ...payload, ...hrBroadcast });
    try {
      await sendMail({
        to: staff.email,
        subject: 'Your Overtime Rate Has Been Updated',
        text: `Hello ${staff.name || ''},\n\nYour overtime rate has been updated to ${staff.salary.ot} per hour.\n\nIf you have questions, please contact HR.`,
        html: `<p>Hello ${staff.name || ''},</p><p>Your overtime rate has been updated to <b>${staff.salary.ot}</b> per hour.</p><p>If you have questions, please contact HR.</p>`
      });
    } catch (_) {}
    res.json({ message: 'Overtime rate updated', email: staff.email, overtimeRate: staff.salary.ot });
  } catch (error) {
    console.error('HR set overtime rate error:', error);
    res.status(500).json({ message: 'Failed to update overtime rate' });
  }
});

// HR: Adjust regular pay (base salary) for a staff member by email
router.patch('/staff/:email/pay', authRequired, allowRoles('hr_manager', 'admin', 'staff_manager'), async (req, res) => {
  try {
    const { email } = req.params;
    const { amount, operation } = req.body; // operation: 'increase' | 'decrease' | 'set'

    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ message: 'amount must be a positive number' });
    }

    const targetEmail = email.toLowerCase();

    // If the caller is a staff_manager, only allow changing their own salary
    if (req.user?.role === 'staff_manager') {
      const caller = await User.findById(req.user.id);
      if (!caller || caller.email.toLowerCase() !== targetEmail) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    const staff = await Staff.findOne({ email: targetEmail });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    const current = staff.salary?.basic ?? 0;

    let next = current;
    if (operation === 'increase') next = current + amount;
    else if (operation === 'decrease') next = Math.max(0, current - amount);
    else if (operation === 'set') next = amount;
    else return res.status(400).json({ message: "operation must be 'increase', 'decrease', or 'set'" });

    staff.salary.basic = next;
    await staff.save();
    const staffEmail = staff.email?.trim().toLowerCase();
    const payload = { email: staffEmail, type: 'pay', previous: current, current: next };
    const hrBroadcast = await buildSalaryBroadcast(staffEmail);
    notifyUserEmail(staffEmail, 'compensation:update', payload);
    emitToUser(staffEmail, 'compensation:update', payload);
    emitToRole('staff_manager', 'hr:update', { ...hrBroadcast, type: 'pay', email: staffEmail });

    try {
      await sendMail({
        to: staff.email,
        subject: 'Your Regular Pay Has Been Updated',
        text: `Hello ${staff.name || ''},\n\nYour regular pay has been updated from ${current} to ${next}.\n\nIf you have questions, please contact HR.`,
        html: `<p>Hello ${staff.name || ''},</p><p>Your regular pay has been updated from <b>${current}</b> to <b>${next}</b>.</p><p>If you have questions, please contact HR.</p>`
      });
    } catch (_) {}

    res.json({ message: 'Regular pay updated', email: staff.email, previous: current, current: next });
    console.log(`Regular pay updated for ${staff.email}: ${current} -> ${next}`);
  } catch (error) {
    console.error('HR adjust pay error:', error);
    res.status(500).json({ message: 'Failed to update regular pay' });
  }
});

// HR: Get salary information for all staff members
router.get('/staff/salary', authRequired, allowRoles('hr_manager', 'admin', 'finance_manager'), async (req, res) => {
  try {
    console.log('🔐 HR Manager salary endpoint called');
    console.log('🔐 HR User role:', req.user?.role);
    console.log('🔐 HR Request headers:', Object.keys(req.headers));

    const staffMembers = await Staff.find({ role: { $in: ['staff_manager', 'staff_member', 'staff'] } }, 'name email salary extraWork');

    console.log(`Found ${staffMembers.length} staff members`);

    // If no staff members found, return empty array instead of error
    if (staffMembers.length === 0) {
      console.log('No staff members found, returning empty array');
      return res.json({ staff: [] });
    }

    const salaryDetails = await Promise.all(staffMembers.map(async (staff) => {
      const baseSalary = staff.salary?.basic ?? 0;
      const overtimeRate = staff.salary?.ot ?? 0;

      // Calculate current month extra work hours
      const currentMonthStart = new Date();
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);

      const currentMonthEnd = new Date(currentMonthStart);
      currentMonthEnd.setMonth(currentMonthEnd.getMonth() + 1);
      currentMonthEnd.setDate(0);
      currentMonthEnd.setHours(23, 59, 59, 999);

      const extraWorkRecords = staff.extraWork.filter(rec =>
        rec.date >= currentMonthStart && rec.date <= currentMonthEnd
      );

      const totalExtraHours = extraWorkRecords.reduce((sum, w) => sum + (w.hours || 0), 0);
      const extraWorkPay = totalExtraHours * overtimeRate;
      const totalPay = baseSalary + extraWorkPay;

      const result = {
        email: staff.email,
        name: staff.name,
        baseSalary,
        regularPay: baseSalary,
        otRate: overtimeRate,
        extraWorkHours: totalExtraHours,
        extraWorkPay,
        totalPay
      };

      console.log(`Salary data for ${staff.email}:`, result);
      return result;
    }));

    console.log('Sending salary details to HR Manager:', salaryDetails);
    res.json({ staff: salaryDetails });
  } catch (error) {
    console.error('Error fetching all staff salaries:', error);
    res.status(500).json({ message: 'Failed to fetch all staff salaries' });
  }
});

export default router;
// List pending attendance approvals (optionally filter by email or date)
router.get('/attendance/pending', authRequired, allowRoles('hr_manager', 'admin'), async (req, res) => {
  try {
    const { email } = req.query;
    const match = email ? { email: email.toLowerCase() } : {};
    const staffList = await Staff.find(match, 'name email attendance');
    const pending = [];
    for (const s of staffList) {
      (s.attendance || []).forEach((rec, idx) => {
        if (rec.approvalStatus === 'pending') {
          pending.push({
            staffId: s._id,
            name: s.name,
            email: s.email,
            index: idx,
            date: rec.date,
            checkInTime: rec.checkInTime,
            checkOutTime: rec.checkOutTime,
            hoursWorked: rec.hoursWorked
          });
        }
      });
    }
    res.json({ pending });
  } catch (error) {
    console.error('HR list pending attendance error:', error);
    res.status(500).json({ message: 'Failed to list pending attendance' });
  }
});

// Approve or reject a specific attendance record by staff email and date
router.post('/attendance/decision', authRequired, allowRoles('hr_manager', 'admin'), async (req, res) => {
  try {
    const { email, date, decision, note } = req.body; // decision: 'approve' | 'reject'
    if (!email || !date || !['approve','reject'].includes(decision)) {
      return res.status(400).json({ message: 'email, date, and valid decision are required' });
    }
    const staff = await Staff.findOne({ email: email.toLowerCase() });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const target = (staff.attendance || []).find(r => new Date(r.date).toISOString().split('T')[0] === new Date(date).toISOString().split('T')[0]);
    if (!target) return res.status(404).json({ message: 'Attendance record not found' });

    target.approvalStatus = decision === 'approve' ? 'approved' : 'rejected';
    target.approvedBy = req.user?.id;
    target.approvalNote = note;
    await staff.save();

    res.json({ message: 'Decision recorded', status: target.approvalStatus });
  } catch (error) {
    console.error('HR attendance decision error:', error);
    res.status(500).json({ message: 'Failed to record decision' });
  }
});

// HR: Set ALL staff members' base salary to a specific amount
router.post('/staff/base-salary/set-all', authRequired, allowRoles('hr_manager', 'admin'), async (req, res) => {
  try {
    const { amount } = req.body;
    if (typeof amount !== 'number' || amount < 0) {
      return res.status(400).json({ message: 'amount must be a non-negative number' });
    }
    const result = await Staff.updateMany({}, { $set: { 'salary.basic': amount } });
    res.json({ message: `All staff base salaries set to ${amount}`, matched: result.matchedCount ?? result.n, modified: result.modifiedCount ?? result.nModified });
  } catch (error) {
    console.error('HR set-all base salary error:', error);
    res.status(500).json({ message: 'Failed to set base salaries' });
  }
});


