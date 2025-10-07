import fs from 'fs';
import path from 'path';
import Joi from 'joi';
import slugify from 'slugify';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import Booking from '../models/Booking.js';

export async function updateProfile(req, res) {
  const schema = Joi.object({ name: Joi.string().min(2), phone: Joi.string().allow(''), address: Joi.string().allow('') });
  const { value, error } = schema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });
  const user = await User.findByIdAndUpdate(req.user.id, value, { new: true });
  await AuditLog.create({ actor: req.user.id, action: 'profile_update', meta: value });
  res.json({ user });
}

export async function deleteAccount(req, res) {
  await User.findByIdAndDelete(req.user.id);
  await AuditLog.create({ actor: req.user.id, action: 'account_delete' });
  res.json({ ok: true });
}

// Multer handler is attached in route. This endpoint saves the file path to avatarUrl.
export async function uploadAvatar(req, res) {
  if (!req.file) return res.status(400).json({ message: 'No image' });
  const urlPath = `/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { avatarUrl: urlPath }, { new: true });
  await AuditLog.create({ actor: req.user.id, action: 'avatar_update', meta: { avatarUrl: urlPath } });
  res.json({ user });
}

export async function listUsers(req, res) {
  const users = await User.find().select('name email role avatarUrl createdAt');
  res.json({ users });
}

export async function setRole(req, res) {
  const { userId, role } = req.body;
  if (!['user', 'advisor', 'manager', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const user = await User.findByIdAndUpdate(userId, { role }, { new: true });
  await AuditLog.create({ actor: req.user.id, action: 'role_change', meta: { userId, role } });
  res.json({ user });
}

export async function getAuditLogs(req, res) {
  const logs = await (await import('../models/AuditLog.js')).default.find().sort({ createdAt: -1 }).limit(200);
  res.json({ logs });
}

export async function getUserStats(req, res) {
  const { userId } = req.params;
  const user = await User.findById(userId).select('name email bookingCount isLoyaltyEligible createdAt');
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  // Get user's booking history
  const bookings = await Booking.find({ user: userId }).select('serviceType date status createdAt').sort({ createdAt: -1 });
  
  res.json({ 
    user, 
    bookings,
    loyaltyStatus: user.isLoyaltyEligible ? 'Eligible for loyalty program' : `${6 - user.bookingCount > 0 ? 6 - user.bookingCount : 0} more bookings needed for loyalty`
  });
}

export async function requestLoyaltyDiscount(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (!user.isLoyaltyEligible) {
    return res.status(400).json({ message: 'You need 6+ bookings to be eligible for loyalty discount' });
  }
  if (user.loyaltyDiscountRequested) {
    return res.status(400).json({ message: 'You have already requested a loyalty discount' });
  }
  // Mark discount as requested
  user.loyaltyDiscountRequested = true;
  user.loyaltyDiscountRequestDate = new Date();
  await user.save();
  // TODO: Send automatic notification to finance department
  // This will be implemented when finance system is ready
  console.log(`💰 LOYALTY DISCOUNT REQUEST: User ${user.name} (${user.email}) has requested a loyalty discount!`);
  console.log(`📊 User Details: ${user.bookingCount} bookings, Request Date: ${user.loyaltyDiscountRequestDate}`);
  console.log(`📧 Finance Department Notification: Please review loyalty discount request for ${user.email}`);
  await AuditLog.create({ 
    actor: req.user.id, 
    action: 'loyalty_discount_request', 
    meta: { 
      bookingCount: user.bookingCount,
      requestDate: user.loyaltyDiscountRequestDate
    } 
  });
  res.json({ 
    message: 'Loyalty discount request sent to finance department',
    requestDate: user.loyaltyDiscountRequestDate
  });
}

// Development helper: Create test advisors
export async function createTestAdvisors(req, res) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'This endpoint is not available in production' });
  }

  try {
    // Create 30 test advisors
    const testAdvisors = [];
    for (let i = 1; i <= 30; i++) {
      testAdvisors.push({
        name: `Advisor ${i}`,
        email: `advisor${i}@autoelite.com`,
        password: 'password123',
        role: 'advisor',
        isAvailable: true,
        maxConcurrentBookings: 1, // One advisor = one appointment at a time
        specializations: ['General Service', 'Oil Change', 'Diagnostics', 'Body Work']
      });
    }

    const createdAdvisors = [];
    for (const advisorData of testAdvisors) {
      // Check if advisor already exists
      const existingAdvisor = await User.findOne({ email: advisorData.email });
      if (!existingAdvisor) {
        const advisor = await User.create(advisorData);
        createdAdvisors.push(advisor);
      } else {
        createdAdvisors.push(existingAdvisor);
      }
    }

    res.json({ 
      message: `Test advisors created/verified successfully (${createdAdvisors.length}/30)`,
      advisors: createdAdvisors.map(a => ({ id: a._id, name: a.name, email: a.email, role: a.role }))
    });
  } catch (error) {
    console.error('Error creating test advisors:', error);
    res.status(500).json({ message: 'Failed to create test advisors', error: error.message });
  }
}

// Advisor Management Functions
export async function getAdvisors(req, res) {
  try {
    const advisors = await User.find({ role: 'advisor' }).select('-password');
    res.json({ advisors });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch advisors', error: error.message });
  }
}

export async function createAdvisor(req, res) {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      specializations: Joi.array().items(Joi.string()).default([]),
      isAvailable: Joi.boolean().default(true),
      maxConcurrentBookings: Joi.number().min(1).max(10).default(1)
    });

    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // Check if email already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const advisor = await User.create({
      ...value,
      role: 'advisor'
    });

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'advisor_create', 
      meta: { advisorId: advisor._id, name: advisor.name } 
    });

    res.status(201).json({ 
      message: 'Advisor created successfully',
      advisor: { 
        _id: advisor._id, 
        name: advisor.name, 
        email: advisor.email, 
        role: advisor.role,
        specializations: advisor.specializations,
        isAvailable: advisor.isAvailable,
        maxConcurrentBookings: advisor.maxConcurrentBookings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create advisor', error: error.message });
  }
}

export async function updateAdvisor(req, res) {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().min(2),
      email: Joi.string().email(),
      password: Joi.string().min(6).optional(),
      specializations: Joi.array().items(Joi.string()),
      isAvailable: Joi.boolean(),
      maxConcurrentBookings: Joi.number().min(1).max(10)
    });

    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const advisor = await User.findById(id);
    if (!advisor || advisor.role !== 'advisor') {
      return res.status(404).json({ message: 'Advisor not found' });
    }

    // If email is being updated, check for duplicates
    if (value.email && value.email !== advisor.email) {
      const existingUser = await User.findOne({ email: value.email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }
    }

    // Update fields
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        advisor[key] = value[key];
      }
    });

    await advisor.save();

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'advisor_update', 
      meta: { advisorId: advisor._id, name: advisor.name } 
    });

    res.json({ 
      message: 'Advisor updated successfully',
      advisor: { 
        _id: advisor._id, 
        name: advisor.name, 
        email: advisor.email, 
        role: advisor.role,
        specializations: advisor.specializations,
        isAvailable: advisor.isAvailable,
        maxConcurrentBookings: advisor.maxConcurrentBookings
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update advisor', error: error.message });
  }
}

export async function deleteAdvisor(req, res) {
  try {
    const { id } = req.params;
    
    const advisor = await User.findById(id);
    if (!advisor || advisor.role !== 'advisor') {
      return res.status(404).json({ message: 'Advisor not found' });
    }

    // Check if advisor has any active bookings
    const activeBookings = await Booking.find({
      advisor: advisor._id,
      status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({ 
        message: `Cannot delete advisor. They have ${activeBookings.length} active bookings.` 
      });
    }

    await User.findByIdAndDelete(id);

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'advisor_delete', 
      meta: { advisorId: advisor._id, name: advisor.name } 
    });

    res.json({ message: 'Advisor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete advisor', error: error.message });
  }
}

export async function updateAdvisorAvailability(req, res) {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    const advisor = await User.findById(id);
    if (!advisor || advisor.role !== 'advisor') {
      return res.status(404).json({ message: 'Advisor not found' });
    }

    advisor.isAvailable = isAvailable;
    await advisor.save();

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'advisor_availability_update', 
      meta: { advisorId: advisor._id, name: advisor.name, isAvailable } 
    });

    res.json({ 
      message: 'Advisor availability updated successfully',
      advisor: { 
        _id: advisor._id, 
        name: advisor.name, 
        isAvailable: advisor.isAvailable 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update advisor availability', error: error.message });
  }
}

// Staff Management Functions
export async function getStaff(req, res) {
  try {
    const { role } = req.query;
    let query = { 
      role: { $in: ['advisor', 'finance_manager', 'inventory_manager', 'staff_member', 'staff_manager'] } 
    };
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    const staff = await User.find(query).select('name email role department permissions phone address createdAt');
    res.json({ staff });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch staff', error: error.message });
  }
}

export async function createStaff(req, res) {
  try {
    const schema = Joi.object({
      name: Joi.string().min(2).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().valid('advisor', 'finance_manager', 'inventory_manager', 'staff_member', 'staff_manager').required(),
      specializations: Joi.array().items(Joi.string()).default([]),
      isAvailable: Joi.boolean().default(true),
      maxConcurrentBookings: Joi.number().min(1).max(10).default(1),
      department: Joi.string().allow(''),
      permissions: Joi.array().items(Joi.string()).default([])
    });

    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    // Check if email already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const staff = await User.create(value);

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'staff_create', 
      meta: { staffId: staff._id, name: staff.name, role: staff.role } 
    });

    res.status(201).json({ 
      message: 'Staff member created successfully',
      staff: { 
        _id: staff._id, 
        name: staff.name, 
        email: staff.email, 
        role: staff.role,
        specializations: staff.specializations,
        isAvailable: staff.isAvailable,
        maxConcurrentBookings: staff.maxConcurrentBookings,
        department: staff.department,
        permissions: staff.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create staff member', error: error.message });
  }
}

export async function updateStaff(req, res) {
  try {
    const { id } = req.params;
    const schema = Joi.object({
      name: Joi.string().min(2),
      email: Joi.string().email(),
      password: Joi.string().min(6).optional(),
      role: Joi.string().valid('advisor', 'finance_manager', 'inventory_manager', 'staff_member', 'staff_manager'),
      specializations: Joi.array().items(Joi.string()),
      isAvailable: Joi.boolean(),
      maxConcurrentBookings: Joi.number().min(1).max(10),
      department: Joi.string().allow(''),
      permissions: Joi.array().items(Joi.string())
    });

    const { value, error } = schema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const staff = await User.findById(id);
    if (!staff || !['advisor', 'finance_manager', 'inventory_manager', 'staff_member', 'staff_manager'].includes(staff.role)) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // If email is being updated, check for duplicates
    if (value.email && value.email !== staff.email) {
      const existingUser = await User.findOne({ email: value.email });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }
    }

    // Update fields
    Object.keys(value).forEach(key => {
      if (value[key] !== undefined) {
        staff[key] = value[key];
      }
    });

    await staff.save();

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'staff_update', 
      meta: { staffId: staff._id, name: staff.name, role: staff.role } 
    });

    res.json({ 
      message: 'Staff member updated successfully',
      staff: { 
        _id: staff._id, 
        name: staff.name, 
        email: staff.email, 
        role: staff.role,
        specializations: staff.specializations,
        isAvailable: staff.isAvailable,
        maxConcurrentBookings: staff.maxConcurrentBookings,
        department: staff.department,
        permissions: staff.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update staff member', error: error.message });
  }
}

export async function deleteStaff(req, res) {
  try {
    const { id } = req.params;
    
    const staff = await User.findById(id);
    if (!staff || !['advisor', 'finance_manager', 'inventory_manager', 'staff_member', 'staff_manager'].includes(staff.role)) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    // Check if advisor has any active bookings
    if (staff.role === 'advisor') {
      const activeBookings = await Booking.find({
        advisor: staff._id,
        status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
      });

      if (activeBookings.length > 0) {
        return res.status(400).json({ 
          message: `Cannot delete advisor. They have ${activeBookings.length} active bookings.` 
        });
      }
    }

    await User.findByIdAndDelete(id);

    try {
      const StaffProfile = (await import('../models/staffMng/Staff.js')).default;
      await StaffProfile.deleteOne({ email: staff.email });
    } catch (error) {
      console.warn('Failed to delete staffMng profile for', staff.email, error?.message || error);
    }

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'staff_delete', 
      meta: { staffId: staff._id, name: staff.name, role: staff.role } 
    });

    res.json({ message: 'Staff member deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete staff member', error: error.message });
  }
}

export async function updateStaffAvailability(req, res) {
  try {
    console.log('updateStaffAvailability called with:', { 
      params: req.params, 
      body: req.body, 
      user: req.user,
      method: req.method,
      url: req.url,
      headers: req.headers
    });
    
    const { id } = req.params;
    const { isAvailable } = req.body;

    console.log('Parsed values:', { id, isAvailable });

    // Validate request body
    if (typeof isAvailable !== 'boolean') {
      console.log('Invalid isAvailable value:', isAvailable);
      return res.status(400).json({ message: 'isAvailable must be a boolean value' });
    }

    const staff = await User.findById(id);
    if (!staff || !['advisor', 'finance_manager', 'inventory_manager', 'staff_member'].includes(staff.role)) {
      console.log('Staff not found or invalid role:', { id, staff: staff?.role });
      return res.status(404).json({ message: 'Staff member not found' });
    }

    console.log('Updating staff availability:', { 
      staffId: staff._id, 
      staffName: staff.name, 
      currentAvailability: staff.isAvailable, 
      newAvailability: isAvailable 
    });

    staff.isAvailable = isAvailable;
    await staff.save();

    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'staff_availability_update', 
      meta: { staffId: staff._id, name: staff.name, isAvailable } 
    });

    console.log('Staff availability updated successfully');

    res.json({ 
      message: 'Staff availability updated successfully',
      staff: { 
        _id: staff._id, 
        name: staff.name, 
        isAvailable: staff.isAvailable 
      }
    });
  } catch (error) {
    console.error('Error in updateStaffAvailability:', error);
    res.status(500).json({ message: 'Failed to update staff availability', error: error.message });
  }
}

export async function getLoyaltyRequests(req, res) {
  try {
    const requests = await User.find({ loyaltyDiscountRequested: true })
      .select('name email bookingCount isLoyaltyEligible loyaltyDiscountRequested loyaltyDiscountApproved loyaltyDiscountRequestDate loyaltyDiscountApprovalDate');
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch loyalty requests', error: error.message });
  }
}
