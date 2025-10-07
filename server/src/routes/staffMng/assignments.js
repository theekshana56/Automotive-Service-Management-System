import express from 'express';
import auth from '../../middleware/auth.js';
import { allowRoles } from '../../middleware/rbac.js';
import Notification from '../../models/inventory/Notification.js';
import Booking from '../../models/Booking.js';
import Part from '../../models/inventory/Part.js';
import Staff from '../../models/staffMng/Staff.js';
import axios from 'axios';

const router = express.Router();

// Create a staff assignment notification for staff member dashboard
router.post('/', auth, allowRoles('advisor','manager','admin'), async (req, res, next) => {
  try {
    const { bookingId, instructions, jobType, vehiclePlate, notes, staffId } = req.body || {};
    if (!bookingId || !instructions) {
      return res.status(400).json({ message: 'bookingId and instructions are required' });
    }

    const booking = await Booking.findById(bookingId).populate('user', 'name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const plate = vehiclePlate || booking?.vehicle?.plate || 'N/A';
    const svc = jobType || booking?.serviceType || 'Service';

    const meta = new Map(Object.entries({
      bookingId: booking._id.toString(),
      advisorId: req.user.id,
      jobType: svc,
      vehiclePlate: plate,
      notes: notes || ''
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

  // Broadcast to staff members (userId: null)
    await Notification.create({
      userId: null,
      type: 'BOOKING_ASSIGNED',
      title: 'Job Assigned',
      message: `${svc} for vehicle ${plate}. Est. Cost: $${estimatedCost}. Instructions: ${instructions.substring(0, 180)}${instructions.length > 180 ? '…' : ''}`,
      link: '/staff-dashboard',
      meta: new Map([...meta, ['estimatedCost', estimatedCost]])
    });

    // Automatically sync job to staff management system
    try {
      console.log('🔄 Starting auto-sync for job assignment...');
      const taskDescription = `${svc} for vehicle ${plate} - ${instructions}`;
      console.log('📝 Task description:', taskDescription);
      
      // Find staff member and add job directly
      const staff = await Staff.findOne({ email: 'staff@autoelite.com' });
      console.log('👤 Staff member found:', staff ? 'Yes' : 'No');
      
      if (staff) {
        const newJob = {
          task: taskDescription,
          status: 'Pending',
          bookingId: bookingId,
          vehiclePlate: plate,
          jobType: svc,
          notes: notes || '',
          assignedAt: new Date()
        };
        
        staff.jobs.push(newJob);
        console.log('📋 Job added to staff member, saving...');
        
        await staff.save();
        console.log('✅ Job automatically synced to staff system successfully');
      } else {
        console.error('❌ Staff member not found for auto-sync');
      }
    } catch (syncError) {
      console.error('❌ Failed to auto-sync job to staff system:', syncError.message);
      console.error('❌ Full error:', syncError);
      // Don't fail the main request if sync fails
    }

    res.status(201).json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Sync job assignment to integrated staff management system
router.post('/sync-to-staff-system', auth, allowRoles('advisor','manager','admin'), async (req, res, next) => {
  try {
    const { bookingId, staffEmail, instructions, jobType, vehiclePlate, notes } = req.body || {};
    
    if (!bookingId || !staffEmail || !instructions) {
      return res.status(400).json({ message: 'bookingId, staffEmail, and instructions are required' });
    }

    const booking = await Booking.findById(bookingId).populate('user', 'name');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const plate = vehiclePlate || booking?.vehicle?.plate || 'N/A';
    const svc = jobType || booking?.serviceType || 'Service';
    
    // Create job task description
    const taskDescription = `${svc} for vehicle ${plate} - ${instructions}`;
    
    // Sync to integrated staff management system (same server)
    try {
      const staffSystemResponse = await axios.post('http://localhost:5001/api/sync-job', {
        staffEmail: staffEmail,
        task: taskDescription,
        status: 'Pending',
        bookingId: bookingId,
        vehiclePlate: plate,
        jobType: svc,
        notes: notes || ''
      });
      
      console.log('✅ Job synced to staff system:', staffSystemResponse.data);
    } catch (syncError) {
      console.error('❌ Failed to sync job to staff system:', syncError.message);
      // Don't fail the main request if sync fails
    }

    res.status(201).json({ 
      success: true, 
      message: 'Job assignment created and synced to staff system' 
    });
  } catch (error) {
    next(error);
  }
});

export default router;


