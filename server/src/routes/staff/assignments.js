import express from 'express';
import auth from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import Notification from '../../models/inventory/Notification.js';
import Booking from '../../models/Booking.js';
import Part from '../../models/inventory/Part.js';
import User from '../../models/User.js';
import { emitToUser, notifyUserEmail } from '../../services/notificationService.js';

const router = express.Router();

// Create a staff assignment notification for staff member dashboard
router.post('/', auth, allowRoles('advisor','manager','admin'), async (req, res, next) => {
  try {
    const { bookingId, instructions, jobType, vehiclePlate, notes, staffManagerId } = req.body || {};
    if (!bookingId || !instructions) {
      return res.status(400).json({ message: 'bookingId and instructions are required' });
    }
    if (!staffManagerId) {
      return res.status(400).json({ message: 'staffManagerId is required' });
    }

    const booking = await Booking.findById(bookingId).populate('user', 'name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Resolve staff manager email for realtime notification
    const staffManager = await User.findById(staffManagerId).select('email');

    const plate = vehiclePlate || booking?.vehicle?.plate || 'N/A';
    const svc = jobType || booking?.serviceType || 'Service';

    const meta = new Map(Object.entries({
      bookingId: booking._id.toString(),
      advisorId: req.user.id,
      jobType: svc,
      vehiclePlate: plate,
      notes: notes || '',
      staffManagerId: staffManagerId
    }));

    // Auto-generate a simple estimated cost based on job type baseline
    const BASE_COST = {
      'General Service': 150,
      'Oil Change': 80,
      'Diagnostics': 60,
      'Body Work': 200
    };
    const estimatedCost = BASE_COST[svc] ?? 120;
    booking.estimatedCost = estimatedCost;
    await booking.save();

  // Send notification to specific staff member
    const notif = await Notification.create({
      userId: staffManagerId,
      type: 'BOOKING_ASSIGNED',
      title: 'Job Assigned',
      message: `${svc} for vehicle ${plate}. Est. Cost: $${estimatedCost}. Instructions: ${instructions.substring(0, 180)}${instructions.length > 180 ? '…' : ''}`,
      link: '/staff-dashboard',
      meta: new Map([...meta, ['estimatedCost', estimatedCost]])
    });

    // Emit real-time event to the staff manager dashboard
    const staffEmail = staffManager?.email?.trim().toLowerCase();
    const eventPayload = {
      email: staffEmail,
      userId: String(staffManagerId),
      title: 'Job Assigned',
      jobType: svc,
      vehiclePlate: plate,
      estimatedCost,
      bookingId: String(booking._id)
    };

    notifyUserEmail(staffEmail || '', 'assignment:new', eventPayload);
    emitToUser(staffEmail, 'assignment:new', eventPayload);

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Get assigned jobs for a specific staff manager
router.get('/assigned/:staffManagerId', auth, allowRoles('staff_manager','admin'), async (req, res, next) => {
  try {
    const { staffManagerId } = req.params;
    console.log('Getting assigned jobs for staff manager:', staffManagerId);
    
    // Verify the staff manager exists
    const staffManager = await User.findById(staffManagerId);
    if (!staffManager || staffManager.role !== 'staff_manager') {
      console.log('Staff manager not found or invalid role:', staffManager);
      return res.status(404).json({ message: 'Staff manager not found' });
    }
    
    console.log('Staff manager found:', staffManager.name, staffManager.email);
    
    // Get notifications for this staff manager
    const notifications = await Notification.find({
      userId: staffManagerId,
      type: 'BOOKING_ASSIGNED'
    }).sort({ createdAt: -1 });
    
    console.log('Found notifications:', notifications.length);
    
    // Transform notifications into job assignments
    const assignedJobs = notifications.map(notification => {
      const meta = notification.meta;
      console.log('Processing notification:', notification._id, 'Meta:', meta);
      
      // Handle both Map and Object formats
      const getMetaValue = (key) => {
        if (meta instanceof Map) {
          return meta.get(key);
        } else if (typeof meta === 'object' && meta !== null) {
          return meta[key];
        }
        return undefined;
      };
      
      return {
        _id: notification._id,
        bookingId: getMetaValue('bookingId'),
        jobType: getMetaValue('jobType'),
        vehiclePlate: getMetaValue('vehiclePlate'),
        instructions: notification.message,
        notes: getMetaValue('notes'),
        estimatedCost: getMetaValue('estimatedCost'),
        advisorId: getMetaValue('advisorId'),
        status: 'Pending',
        assignedAt: notification.createdAt,
        createdAt: notification.createdAt
      };
    });
    
    res.json({ 
      success: true, 
      jobs: assignedJobs,
      staffManager: {
        _id: staffManager._id,
        name: staffManager.name,
        email: staffManager.email
      }
    });
  } catch (error) {
    next(error);
  }
});

// Test endpoint to create advisor assignments (development only)
router.post('/test-create-assignments', async (req, res, next) => {
  try {
    const { staffManagerId } = req.body;
    
    if (!staffManagerId) {
      return res.status(400).json({ message: 'staffManagerId is required' });
    }

    // Create test advisor assignments
    const testAssignments = [
      {
        userId: staffManagerId,
        type: 'BOOKING_ASSIGNED',
        title: 'Job Assigned',
        message: 'Oil Change for vehicle ABC123. Est. Cost: $80. Instructions: Perform regular 5000km service with synthetic oil',
        link: '/staff-dashboard',
        meta: new Map([
          ['bookingId', 'booking-test-001'],
          ['advisorId', 'advisor-test-001'],
          ['jobType', 'Oil Change'],
          ['vehiclePlate', 'ABC123'],
          ['notes', 'Customer requested synthetic oil'],
          ['estimatedCost', 80]
        ])
      },
      {
        userId: staffManagerId,
        type: 'BOOKING_ASSIGNED',
        title: 'Job Assigned',
        message: 'Brake Inspection for vehicle XYZ789. Est. Cost: $150. Instructions: Check brake pads, rotors, and fluid levels',
        link: '/staff-dashboard',
        meta: new Map([
          ['bookingId', 'booking-test-002'],
          ['advisorId', 'advisor-test-001'],
          ['jobType', 'Brake Inspection'],
          ['vehiclePlate', 'XYZ789'],
          ['notes', 'Customer reported squeaking noise'],
          ['estimatedCost', 150]
        ])
      },
      {
        userId: staffManagerId,
        type: 'BOOKING_ASSIGNED',
        title: 'Job Assigned',
        message: 'Engine Diagnostic for vehicle DEF456. Est. Cost: $120. Instructions: Run full diagnostic scan and check engine codes',
        link: '/staff-dashboard',
        meta: new Map([
          ['bookingId', 'booking-test-003'],
          ['advisorId', 'advisor-test-001'],
          ['jobType', 'Engine Diagnostic'],
          ['vehiclePlate', 'DEF456'],
          ['notes', 'Check engine light is on'],
          ['estimatedCost', 120]
        ])
      }
    ];

    const createdNotifications = [];
    for (const assignment of testAssignments) {
      const notification = await Notification.create(assignment);
      createdNotifications.push(notification);
    }

    res.json({
      success: true,
      message: `Created ${createdNotifications.length} test advisor assignments`,
      assignments: createdNotifications.map(n => ({
        id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        createdAt: n.createdAt
      }))
    });
  } catch (error) {
    console.error('Error creating test assignments:', error);
    next(error);
  }
});

export default router;


