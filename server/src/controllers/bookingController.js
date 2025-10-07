import Joi from 'joi';
import dayjs from 'dayjs';
import PDFDocument from 'pdfkit';
import Booking from '../models/Booking.js';
import Notification, { NOTIFICATION_TYPES } from '../models/inventory/Notification.js';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const bookingSchema = Joi.object({
  serviceType: Joi.string().valid('General Service','Oil Change','Diagnostics','Body Work').required(),
  vehicle: Joi.object({
    model: Joi.string().required(),
    year: Joi.number().min(1980).max(2100).required(),
    plate: Joi.string().required()
  }).required(),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  timeSlot: Joi.string().required(),
  notes: Joi.string().allow(''),
  advisor: Joi.string().optional()
});

// Helper function to find available advisor
async function findAvailableAdvisor(serviceType, date, timeSlot) {
  console.log(`🔍 Looking for advisor for service: ${serviceType}, date: ${date}, time: ${timeSlot}`);

  // First, check how many advisors are already assigned to this time slot
  const advisorsAssignedToSlot = await Booking.countDocuments({
    date: date,
    timeSlot: timeSlot,
    status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
  });

  console.log(`📊 Advisors already assigned to ${timeSlot}: ${advisorsAssignedToSlot}/30`);

  // If all 30 advisors are already assigned to this time slot, return null
  if (advisorsAssignedToSlot >= 30) {
    console.log(`❌ All 30 advisors are already assigned to ${timeSlot}`);
    return null;
  }

  // Get all available advisors with the required specialization
  let availableAdvisors = await User.find({ 
    role: 'advisor', 
    isAvailable: true,
    specializations: { $in: [serviceType] } // Only advisors who can handle this service type
  });

  // Get advisors already assigned to this time slot
  const assignedAdvisors = await Booking.find({
    date: date,
    timeSlot: timeSlot,
    status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
  }).select('advisor');
  
  // Filter out bookings without advisors and get advisor IDs
  const assignedAdvisorIds = assignedAdvisors
    .filter(b => b.advisor) // Only include bookings with advisors
    .map(b => b.advisor.toString());

  // Filter out advisors already assigned to this slot
  availableAdvisors = availableAdvisors.filter(advisor => !assignedAdvisorIds.includes(advisor._id.toString()));

  if (availableAdvisors.length > 0) {
    const selected = availableAdvisors[0];
    console.log(`✅ Found available advisor: ${selected.name} (ID: ${selected._id})`);
    return selected;
  }

  // If no available advisor with specialization, try any available advisor
  let anyAvailableAdvisors = await User.find({ role: 'advisor', isAvailable: true });
  anyAvailableAdvisors = anyAvailableAdvisors.filter(advisor => !assignedAdvisorIds.includes(advisor._id.toString()));
  if (anyAvailableAdvisors.length > 0) {
    const selected = anyAvailableAdvisors[0];
    console.log(`✅ Fallback: Found any available advisor: ${selected.name} (ID: ${selected._id})`);
    return selected;
  }

  console.log(`❌ No available advisors found for ${timeSlot}`);
  return null;
}

// Helper function to add booking to queue
async function addToQueue(serviceType, date, timeSlot, userId, vehicle, notes) {
  console.log(`📋 Adding booking to queue for ${timeSlot} on ${date}`);
  
  // Get current queue position for this time slot
  const currentQueueLength = await Booking.countDocuments({
    date: date,
    timeSlot: timeSlot,
    isQueued: true
  });
  
  const queuePosition = currentQueueLength + 1;
  
  // Calculate estimated service time based on queue position
  // Each service takes approximately 1 hour, so add queue position hours to the original time
  const [hour] = timeSlot.split('-')[0].split(':');
  const originalHour = parseInt(hour);
  const estimatedHour = originalHour + queuePosition;
  
  // Create estimated service time (next available day if hour exceeds 17)
  let estimatedDate = date;
  let estimatedTimeSlot = timeSlot;
  
  if (estimatedHour > 17) {
    // Move to next day
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    estimatedDate = nextDate.toISOString().slice(0, 10);
    estimatedTimeSlot = '09:00-10:00'; // Start with first slot of next day
  } else {
    // Same day, different time slot
    const newHour = estimatedHour.toString().padStart(2, '0');
    estimatedTimeSlot = `${newHour}:00-${newHour + 1}:00`;
  }
  
  const estimatedServiceTime = new Date(`${estimatedDate}T${estimatedTimeSlot.split('-')[0]}:00`);
  
  // Create queued booking
  const queuedBooking = await Booking.create({
    user: userId,
    serviceType,
    vehicle,
    date,
    timeSlot,
    notes,
    status: 'Queued',
    isQueued: true,
    queuePosition,
    queueStartTime: new Date(),
    estimatedServiceTime,
    slotId: generateSlotId(date, timeSlot),
    isSlotAvailable: false
  });
  
  console.log(`✅ Added to queue at position ${queuePosition}, estimated service time: ${estimatedServiceTime}`);
  
  return queuedBooking;
}

// Helper function to process queue when advisor becomes available
async function processQueue(date, timeSlot) {
  console.log(`🔄 Processing queue for ${timeSlot} on ${date}`);
  
  // Get the next queued booking for this time slot
  const nextQueuedBooking = await Booking.findOne({
    date: date,
    timeSlot: timeSlot,
    isQueued: true,
    status: 'Queued'
  }).sort({ queuePosition: 1 });
  
  if (!nextQueuedBooking) {
    console.log(`📭 No queued bookings for ${timeSlot}`);
    return null;
  }
  
  // Find available advisor
  const advisor = await findAvailableAdvisor(nextQueuedBooking.serviceType, date, timeSlot);
  
  if (advisor) {
    // Update the queued booking to confirmed
    nextQueuedBooking.status = 'Confirmed';
    nextQueuedBooking.advisor = advisor._id;
    nextQueuedBooking.isQueued = false;
    nextQueuedBooking.isSlotAvailable = false;
    await nextQueuedBooking.save();
    
    console.log(`✅ Processed queued booking ${nextQueuedBooking._id} with advisor ${advisor.name}`);
    
    // Update queue positions for remaining queued bookings
    await Booking.updateMany(
      {
        date: date,
        timeSlot: timeSlot,
        isQueued: true,
        status: 'Queued',
        _id: { $ne: nextQueuedBooking._id }
      },
      {
        $inc: { queuePosition: -1 },
        $set: { estimatedServiceTime: new Date(Date.now() + 60 * 60 * 1000) } // Update estimated time
      }
    );
    // Notify advisor for queued assignment
    try {
      await Notification.create({
        userId: advisor._id,
        type: 'SYSTEM',
        title: 'Queued job assigned',
        message: `${nextQueuedBooking.serviceType} for ${nextQueuedBooking.vehicle?.model || ''} on ${date} ${timeSlot}`,
        link: '/advisor/inspections',
        meta: new Map(Object.entries({ bookingId: nextQueuedBooking._id.toString(), timeSlot }))
      });
    } catch (e) {
      console.warn('Failed to create advisor notification (queue):', e.message);
    }
    
    return nextQueuedBooking;
  }
  
  return null;
}

// Helper function to generate unique slot ID
function generateSlotId(date, timeSlot) {
  return `${date}-${timeSlot}`;
}

async function createBooking(req, res) {
  console.log('📝 Creating booking with data:', JSON.stringify(req.body, null, 2));
  
  const { value, error } = bookingSchema.validate(req.body);
  if (error) {
    console.log('❌ Validation error:', error.message);
    return res.status(400).json({ message: error.message });
  }

  console.log('✅ Validation passed, validated data:', JSON.stringify(value, null, 2));

  // Check if there are any advisors at all
  const totalAdvisors = await User.countDocuments({ role: 'advisor' });
  if (totalAdvisors === 0) {
    console.log('❌ No advisors found in database');
    return res.status(400).json({ message: 'No service advisors are currently available. Please contact support.' });
  }

  console.log('✅ Found advisors, looking for available advisor...');

  // Find available advisor
  const advisor = await findAvailableAdvisor(value.serviceType, value.date, value.timeSlot);
  
  if (advisor) {
    // Advisor is available, create immediate booking
    console.log('✅ Found available advisor:', advisor.name);
    
    // Allow cancellation/modification for 1 hour after booking creation
    const canModifyUntil = dayjs().add(1, 'hour').toDate();
    
    // Create booking with advisor assignment
    const booking = await Booking.create({ 
      ...value, 
      user: req.user.id, 
      advisor: advisor._id,
      canModifyUntil,
      slotId: generateSlotId(value.date, value.timeSlot),
      isSlotAvailable: false
    });

    console.log('✅ Immediate booking created:', booking._id);

    // Increment user's booking count
    const user = await User.findById(req.user.id);
    user.bookingCount += 1;
    
    // Check if user has reached 6 bookings (loyalty discount threshold)
    if (user.bookingCount > 5 && !user.isLoyaltyEligible) {
      user.isLoyaltyEligible = true;
      console.log(`🎉 LOYALTY DISCOUNT ELIGIBLE: User ${user.name} (${user.email}) has reached ${user.bookingCount} bookings! They are now eligible for loyalty discount.`);
    }
    
    await user.save();
    
    await AuditLog.create({ 
      actor: req.user.id, 
      action: 'booking_create', 
      meta: { 
        id: booking._id,
        advisorId: advisor._id,
        slotId: booking.slotId,
        bookingCount: user.bookingCount,
        isLoyaltyEligible: user.isLoyaltyEligible
      } 
    });

    // Create advisor notification
    try {
      await Notification.create({
        userId: advisor._id,
        type: 'SYSTEM',
        title: 'New job assigned',
        message: `${value.serviceType} for ${value.vehicle.model} (${value.vehicle.plate}) on ${value.date} ${value.timeSlot}`,
        link: '/advisor/inspections',
        meta: new Map(Object.entries({ bookingId: booking._id.toString(), timeSlot: value.timeSlot }))
      });
    } catch (e) {
      console.warn('Failed to create advisor notification:', e.message);
    }
    
    console.log('✅ Immediate booking process completed successfully');
    res.status(201).json({ 
      booking, 
      assignedAdvisor: advisor.name,
      message: 'Booking confirmed with immediate advisor assignment'
    });
    
  } else {
    // No advisor available, add to queue
    console.log('📋 No advisor available, adding to queue...');
    
    try {
      const queuedBooking = await addToQueue(
        value.serviceType, 
        value.date, 
        value.timeSlot, 
        req.user.id, 
        value.vehicle, 
        value.notes
      );
      
      // Increment user's booking count
      const user = await User.findById(req.user.id);
      user.bookingCount += 1;
      
      // Check if user has reached 6 bookings (loyalty discount threshold)
      if (user.bookingCount > 5 && !user.isLoyaltyEligible) {
        user.isLoyaltyEligible = true;
        console.log(`🎉 LOYALTY DISCOUNT ELIGIBLE: User ${user.name} (${user.email}) has reached ${user.bookingCount} bookings! They are now eligible for loyalty discount.`);
      }
      
      await user.save();
      
      await AuditLog.create({ 
        actor: req.user.id, 
        action: 'booking_queued', 
        meta: { 
          id: queuedBooking._id,
          slotId: queuedBooking.slotId,
          queuePosition: queuedBooking.queuePosition,
          estimatedServiceTime: queuedBooking.estimatedServiceTime,
          bookingCount: user.bookingCount,
          isLoyaltyEligible: user.isLoyaltyEligible
        } 
      });
      
      console.log('✅ Booking added to queue successfully');
      res.status(201).json({ 
        booking: queuedBooking, 
        message: `Booking added to queue at position ${queuedBooking.queuePosition}. Estimated service time: ${queuedBooking.estimatedServiceTime.toLocaleString()}`,
        isQueued: true,
        queuePosition: queuedBooking.queuePosition,
        estimatedServiceTime: queuedBooking.estimatedServiceTime
      });
      
    } catch (error) {
      console.error('❌ Error adding to queue:', error);
      res.status(500).json({ message: 'Failed to add booking to queue. Please try again.' });
    }
  }
}

async function myBookings(req, res) {
  const bookings = await Booking.find({ user: req.user.id })
    .populate('advisor', 'name email')
    .sort({ createdAt: -1 });
  res.json({ bookings });
}

async function updateBooking(req, res) {
  const { id } = req.params;
  const booking = await Booking.findOne({ _id: id, user: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Not found' });
  if (new Date() > new Date(booking.canModifyUntil)) return res.status(400).json({ message: 'Past modification deadline' });

  const allow = ['serviceType', 'date', 'timeSlot', 'notes', 'vehicle'];
  for (const k of allow) if (req.body[k] !== undefined) booking[k] = req.body[k];
  await booking.save();

  await AuditLog.create({ actor: req.user.id, action: 'booking_update', meta: { id } });
  res.json({ booking });
}

async function cancelBooking(req, res) {
  const { id } = req.params;
  const booking = await Booking.findOne({ _id: id, user: req.user.id });
  if (!booking) return res.status(404).json({ message: 'Not found' });
  
  // For queued bookings, allow cancellation anytime
  if (booking.status !== 'Queued' && new Date() > new Date(booking.canModifyUntil)) {
    return res.status(400).json({ message: 'Past cancellation deadline' });
  }
  
  // Decrement user's booking count
  const user = await User.findById(req.user.id);
  user.bookingCount = Math.max(0, user.bookingCount - 1);
  
  // If booking count drops to 5 or below, remove loyalty eligibility
  if (user.bookingCount <= 5 && user.isLoyaltyEligible) {
    user.isLoyaltyEligible = false;
    user.loyaltyDiscountRequested = false;
    console.log(`📉 LOYALTY ELIGIBILITY REMOVED: User ${user.name} (${user.email}) booking count dropped to ${user.bookingCount}`);
  }
  
  await user.save();
  
  // If this was a queued booking, process the queue for this time slot
  let shouldProcessQueue = false;
  let originalDate = booking.date;
  let originalTimeSlot = booking.timeSlot;
  
  if (booking.status === 'Queued') {
    shouldProcessQueue = true;
    console.log(`📋 Cancelling queued booking ${booking._id} for ${originalTimeSlot} on ${originalDate}`);
  }
  
  booking.status = 'Cancelled';
  booking.isSlotAvailable = true;
  booking.isQueued = false;
  booking.queuePosition = 0;
  await booking.save();
  
  await AuditLog.create({ 
    actor: req.user.id, 
    action: 'booking_cancel', 
    meta: { 
      id,
      wasQueued: shouldProcessQueue,
      bookingCount: user.bookingCount,
      isLoyaltyEligible: user.isLoyaltyEligible
    } 
  });
  
  // Process queue if this was a queued booking
  if (shouldProcessQueue) {
    try {
      const processedBooking = await processQueue(originalDate, originalTimeSlot);
      if (processedBooking) {
        console.log(`✅ Processed queued booking ${processedBooking._id} after cancellation`);
      }
    } catch (error) {
      console.error('❌ Error processing queue after cancellation:', error);
    }
  }
  
  res.json({ ok: true });
}

// Manager can mark advisor (other team's service would be plugged here)
async function assignAdvisor(req, res) {
  const { id } = req.params;
  const { advisorId } = req.body;
  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ message: 'Not found' });
  booking.advisor = advisorId;
  booking.status = 'Confirmed';
  await booking.save();
  await AuditLog.create({ actor: req.user.id, action: 'advisor_assign', meta: { id, advisorId } });
  res.json({ booking });
}

async function bookedSlots(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Date required' });

  // Determine number of available advisors
  const totalAdvisors = await User.countDocuments({ role: 'advisor', isAvailable: true });

  // Aggregate bookings by timeSlot for active statuses
  const agg = await Booking.aggregate([
    { $match: { date: date, status: { $in: ['Pending', 'Confirmed', 'In Progress'] } } },
    { $group: { _id: '$timeSlot', count: { $sum: 1 } } },
    { $match: { count: { $gte: totalAdvisors } } }
  ]);

  const slots = agg.map(a => a._id);
  res.json({ slots });
}

// New function to get available slots with advisor info
async function getAvailableSlots(req, res) {
  const { date } = req.query;
  if (!date) return res.status(400).json({ message: 'Date required' });

  const TIME_SLOTS = [
    '09:00-10:00', '10:00-11:00', '11:00-12:00', '12:00-13:00',
    '13:00-14:00', '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  // Get the real number of advisors in the system
  const totalAdvisors = await User.countDocuments({ role: 'advisor', isAvailable: true });

  const bookedSlots = await Booking.find({ 
    date, 
    status: { $in: ['Pending', 'Confirmed', 'In Progress'] } 
  }).select('timeSlot advisor').populate('advisor', 'name');

  // Get queued bookings for this date
  const queuedBookings = await Booking.find({ 
    date, 
    status: 'Queued',
    isQueued: true
  }).select('timeSlot queuePosition estimatedServiceTime');

  const availableSlots = TIME_SLOTS.map(slot => {
    const bookingsForSlot = bookedSlots.filter(b => b.timeSlot === slot);
    const queuedForSlot = queuedBookings.filter(b => b.timeSlot === slot);
    const advisorsAssigned = bookingsForSlot.length;
    const advisorsAvailable = totalAdvisors - advisorsAssigned;
    const isAvailable = advisorsAvailable > 0;
    const queueLength = queuedForSlot.length;
    
    return {
      timeSlot: slot,
      isAvailable: isAvailable,
      advisorsAssigned: advisorsAssigned,
      advisorsAvailable: advisorsAvailable,
      totalAdvisors: totalAdvisors,
      assignedAdvisors: bookingsForSlot.map(b => b.advisor?.name).filter(Boolean),
      queueLength: queueLength,
      canJoinQueue: true, // Always allow joining queue
      queueInfo: queuedForSlot.length > 0 ? {
        length: queuedForSlot.length,
        estimatedWaitTime: queuedForSlot.length * 60, // 60 minutes per person
        nextAvailableTime: queuedForSlot.length > 0 ? 
          new Date(Date.now() + (queuedForSlot.length * 60 * 60 * 1000)).toLocaleString() : null
      } : null
    };
  });

  res.json({ availableSlots });
}

// Function to mark service as completed and free up slot
async function completeService(req, res) {
  const { id } = req.params;
  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ message: 'Not found' });

  const originalDate = booking.date;
  const originalTimeSlot = booking.timeSlot;

  booking.status = 'Completed';
  booking.serviceEndTime = new Date();
  booking.isSlotAvailable = true;
  await booking.save();

  await AuditLog.create({ 
    actor: req.user.id, 
    action: 'service_completed', 
    meta: { id, advisorId: booking.advisor } 
  });

  // Process queue for this time slot if there are queued bookings
  try {
    const processedBooking = await processQueue(originalDate, originalTimeSlot);
    if (processedBooking) {
      console.log(`✅ Processed queued booking ${processedBooking._id} after service completion`);
    }
  } catch (error) {
    console.error('❌ Error processing queue after service completion:', error);
  }

  res.json({ booking });
}

// Function to get queue information for a user
async function getQueueInfo(req, res) {
  const { date, timeSlot } = req.query;
  if (!date || !timeSlot) return res.status(400).json({ message: 'Date and time slot required' });

  try {
    // Get all queued bookings for this time slot
    const queuedBookings = await Booking.find({
      date: date,
      timeSlot: timeSlot,
      status: 'Queued',
      isQueued: true
    }).populate('user', 'name email').sort({ queuePosition: 1 });

    // Get confirmed bookings to see how many advisors are busy
    const confirmedBookings = await Booking.countDocuments({
      date: date,
      timeSlot: timeSlot,
      status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
    });

    const totalAdvisors = await User.countDocuments({ role: 'advisor', isAvailable: true });
    const advisorsAvailable = totalAdvisors - confirmedBookings;

    res.json({
      queueLength: queuedBookings.length,
      advisorsAvailable: advisorsAvailable,
      totalAdvisors: totalAdvisors,
      queuedBookings: queuedBookings.map(booking => ({
        id: booking._id,
        userName: booking.user.name,
        userEmail: booking.user.email,
        queuePosition: booking.queuePosition,
        estimatedServiceTime: booking.estimatedServiceTime,
        serviceType: booking.serviceType,
        vehicle: booking.vehicle
      })),
      estimatedWaitTime: queuedBookings.length * 60, // 60 minutes per person
      nextAvailableTime: queuedBookings.length > 0 ? 
        new Date(Date.now() + (queuedBookings.length * 60 * 60 * 1000)).toLocaleString() : null
    });
  } catch (error) {
    console.error('Error getting queue info:', error);
    res.status(500).json({ message: 'Failed to get queue information' });
  }
}

// New debug endpoint: returns advisor counts, advisors list and active/queued bookings for a slot
async function debugSlotInfo(req, res) {
  const { date, timeSlot } = req.query;
  if (!date || !timeSlot) return res.status(400).json({ message: 'Date and timeSlot required' });

  try {
    const totalAdvisors = await User.countDocuments({ role: 'advisor' });
    const availableAdvisorsCount = await User.countDocuments({ role: 'advisor', isAvailable: true });
    const advisors = await User.find({ role: 'advisor' }).select('name email isAvailable maxConcurrentBookings specializations');

    const activeBookings = await Booking.find({ date, timeSlot, status: { $in: ['Pending','Confirmed','In Progress'] } }).populate('advisor', 'name isAvailable');
    const queuedBookings = await Booking.find({ date, timeSlot, status: 'Queued', isQueued: true });

    res.json({
      date,
      timeSlot,
      totalAdvisors,
      availableAdvisorsCount,
      advisors,
      activeBookings: activeBookings.map(b => ({ id: b._id, advisor: b.advisor, status: b.status })),
      activeCount: activeBookings.length,
      queuedCount: queuedBookings.length,
      queuedBookings: queuedBookings.map(b => ({ id: b._id, queuePosition: b.queuePosition, user: b.user }))
    });
  } catch (error) {
    console.error('Error in debugSlotInfo:', error);
    res.status(500).json({ message: 'Failed to get debug info' });
  }
}

// Function to manually free up a slot
async function freeSlot(req, res) {
  const { id } = req.params;
  const booking = await Booking.findById(id);
  if (!booking) return res.status(404).json({ message: 'Not found' });

  booking.isSlotAvailable = true;
  await booking.save();

  await AuditLog.create({ 
    actor: req.user.id, 
    action: 'slot_freed', 
    meta: { id } 
  });

  res.json({ booking });
}

// Function to manually process queue for a specific time slot (for testing/management)
async function processQueueManually(req, res) {
  const { date, timeSlot } = req.body;
  if (!date || !timeSlot) return res.status(400).json({ message: 'Date and time slot required' });

  try {
    const processedBooking = await processQueue(date, timeSlot);
    if (processedBooking) {
      res.json({ 
        message: 'Queue processed successfully', 
        processedBooking: {
          id: processedBooking._id,
          user: processedBooking.user,
          serviceType: processedBooking.serviceType,
          estimatedServiceTime: processedBooking.estimatedServiceTime
        }
      });
    } else {
      res.json({ message: 'No queued bookings to process' });
    }
  } catch (error) {
    console.error('Error processing queue manually:', error);
    res.status(500).json({ message: 'Failed to process queue' });
  }
}

// Generate booking report
const generateBookingReport = async (req, res) => {
  console.log('🔍 generateBookingReport function called with params:', req.params);
  console.log('🔍 User ID:', req.user?.id);
  console.log('🔍 User role:', req.user?.role);
  
  try {
    // Handle both route patterns: /:id/report and /report/:id
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user?.id;

    if (!bookingId) {
      console.error('❌ No booking ID provided');
      console.error('❌ req.params:', req.params);
      return res.status(400).json({ 
        message: 'Booking ID is required',
        params: req.params,
        note: 'Expected either req.params.id or req.params.bookingId'
      });
    }

    if (!userId) {
      console.error('❌ No user ID found');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('🔍 Looking for booking:', bookingId);

    // Find the booking and populate user and advisor details
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('advisor', 'name email phone');

    if (!booking) {
      console.error('❌ Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('✅ Booking found:', booking._id);
    console.log('🔍 Booking user ID:', booking.user._id);
    console.log('🔍 Current user ID:', userId);

    // Check if user is authorized to view this report
    if (booking.user._id.toString() !== userId && 
        req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        req.user.role !== 'advisor') {
      console.error('❌ User not authorized to view this report');
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    console.log('✅ User authorized, generating report...');

    // Create report data
    const reportData = {
      bookingId: booking._id,
      reportGeneratedAt: new Date().toISOString(),
      customer: {
        name: booking.user.name,
        email: booking.user.email,
        phone: booking.user.phone
      },
      service: {
        type: booking.serviceType,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        estimatedDuration: booking.estimatedDuration
      },
      vehicle: {
        model: booking.vehicle.model,
        year: booking.vehicle.year,
        plate: booking.vehicle.plate
      },
      advisor: booking.advisor ? {
        name: booking.advisor.name,
        email: booking.advisor.email,
        phone: booking.advisor.phone
      } : null,
      timeline: {
        bookedAt: booking.createdAt,
        canModifyUntil: booking.canModifyUntil,
        serviceStartTime: booking.serviceStartTime,
        serviceEndTime: booking.serviceEndTime,
        queuePosition: booking.queuePosition,
        queueStartTime: booking.queueStartTime,
        estimatedServiceTime: booking.estimatedServiceTime
      },
      notes: booking.notes
    };

    console.log('✅ Report generated successfully');
    res.json({
      success: true,
      report: reportData
    });

  } catch (error) {
    console.error('❌ Error in generateBookingReport:', error);
    res.status(500).json({ 
      message: 'Failed to generate report',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Generate PDF report with AUTO ELITE branding
const generatePDFReport = async (req, res) => {
  console.log('🔍 generatePDFReport function called with params:', req.params);
  console.log('🔍 User ID:', req.user?.id);
  console.log('🔍 User role:', req.user?.role);
  
  try {
    // Handle both route patterns: /:id/report and /report/:id
    const bookingId = req.params.id || req.params.bookingId;
    const userId = req.user?.id;

    if (!bookingId) {
      console.error('❌ No booking ID provided');
      console.error('❌ req.params:', req.params);
      return res.status(400).json({ 
        message: 'Booking ID is required',
        params: req.params,
        note: 'Expected either req.params.id or req.params.bookingId'
      });
    }

    if (!userId) {
      console.error('❌ No user ID found');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('🔍 Looking for booking:', bookingId);

    // Find the booking and populate user and advisor details
    const booking = await Booking.findById(bookingId)
      .populate('user', 'name email phone')
      .populate('advisor', 'name email phone');

    if (!booking) {
      console.error('❌ Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('✅ Booking found:', booking._id);
    console.log('🔍 Booking user ID:', booking.user._id);
    console.log('🔍 Current user ID:', userId);

    // Check if user is authorized to view this report
    if (booking.user._id.toString() !== userId && 
        req.user.role !== 'admin' && 
        req.user.role !== 'manager' && 
        req.user.role !== 'advisor') {
      console.error('❌ User not authorized to view this report');
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    console.log('✅ User authorized, generating PDF report...');

    // Create PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `AUTO ELITE - Booking Report ${bookingId}`,
        Author: 'AUTO ELITE Service Center',
        Subject: 'Service Booking Report',
        Keywords: 'automotive, service, booking, report',
        Creator: 'AUTO ELITE Management System'
      }
    });

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="auto-elite-booking-report-${bookingId}-${new Date().toISOString().split('T')[0]}.pdf"`);

    // Pipe PDF to response
    doc.pipe(res);

    // --- PDF BEAUTIFICATION START ---
    // Set up logo path - use correct path to assets directory
    const logoPath = path.join(__dirname, '..', 'assets', 'WhatsApp Image 2025-08-23 at 08.36.41_4ac10a51.jpg');

    // Professional header layout with logo and company branding
    try {
      console.log('🔍 Attempting to load logo from:', logoPath);
      
      // Create a professional header section with circular logo frame
      // Draw circular background for logo
      doc.circle(500, 60, 35).fill('#f0f0f0').stroke('#444444', 1);
      
      // Logo positioned at center of circle with proper sizing
      doc.image(logoPath, 465, 25, { width: 70, height: 70 });
      console.log('✅ Logo loaded successfully');
      
      // Company name and tagline positioned to the left of logo
      doc.font('Times-Bold').fontSize(24).fillColor('#000000').text('AUTO ELITE', 50, 30);
      doc.font('Times-Roman').fontSize(14).fillColor('#333333').text('Premium Automotive Service Center', 50, 60);
      doc.font('Times-Roman').fontSize(12).fillColor('#666666').text('Professional Service • Quality Care • Elite Experience', 50, 80);
      
    } catch (e) {
      console.warn('❌ Logo image not found or failed to load:', e.message);
      console.warn('📁 Logo path attempted:', logoPath);
      console.warn('📁 Current directory:', __dirname);
      
      // Fallback: Create professional text-based header
      console.log('🔄 Creating fallback professional header...');
      
      // Company name and tagline (left side)
      doc.font('Times-Bold').fontSize(24).fillColor('#000000').text('AUTO ELITE', 50, 30);
      doc.font('Times-Roman').fontSize(14).fillColor('#333333').text('Premium Automotive Service Center', 50, 60);
      doc.font('Times-Roman').fontSize(12).fillColor('#666666').text('Professional Service • Quality Care • Elite Experience', 50, 80);
      
      // Fallback circular logo frame
      doc.circle(500, 60, 35).fill('#f0f0f0').stroke('#444444', 1);
      doc.font('Times-Bold').fontSize(16).fillColor('#000000').text('AUTO ELITE', 500, 55, { align: 'center' });
      doc.font('Times-Roman').fontSize(10).fillColor('#666666').text('LOGO', 500, 70, { align: 'center' });
    }

    // Decorative line below header - positioned after header content
    doc.moveTo(50, 100).lineTo(545, 100).lineWidth(2).strokeColor('#444444').stroke();

    // Main Report Title - Pure black for emphasis
    doc.moveDown(1.5);
    doc.font('Times-Bold').fontSize(18).fillColor('#000000').text('BOOKING REPORT', { align: 'center' });
    doc.moveDown(1);

    // Report Info - Pure black headers, dark gray content
    doc.font('Times-Bold').fontSize(12).fillColor('#000000').text('Report Information', { align: 'center' });
    doc.font('Times-Roman').fontSize(10).fillColor('#000000');
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`Report Type: PDF Report`, { align: 'center' });
    doc.moveDown(2);

    // Section: Customer Information - Pure black headers, pure black content for readability
    doc.font('Times-Bold').fontSize(13).fillColor('#000000').text('CUSTOMER INFORMATION', 50, doc.y);
    doc.font('Times-Roman').fontSize(10).fillColor('#000000');
    doc.text(`Name: ${booking.user.name}`, 70, doc.y + 5);
    doc.text(`Email: ${booking.user.email}`, 70, doc.y);
    doc.text(`Phone: ${booking.user.phone}`, 70, doc.y);
    doc.moveDown(2);

    // Section: Service Details - Pure black headers, pure black content
    doc.font('Times-Bold').fontSize(13).fillColor('#000000').text('SERVICE DETAILS', 50, doc.y + 5);
    doc.font('Times-Roman').fontSize(10).fillColor('#000000');
    doc.text(`Service Type: ${booking.serviceType}`, 70, doc.y + 5);
    doc.text(`Date: ${booking.date}`, 70, doc.y);
    doc.text(`Time Slot: ${booking.timeSlot}`, 70, doc.y);
    doc.text(`Status: ${booking.status}`, 70, doc.y);
    doc.text(`Estimated Duration: ${booking.estimatedDuration} minutes`, 70, doc.y);
    doc.moveDown(2);

    // Section: Vehicle Information - Pure black headers, pure black content
    doc.font('Times-Bold').fontSize(13).fillColor('#000000').text('VEHICLE INFORMATION', 50, doc.y + 5);
    doc.font('Times-Roman').fontSize(10).fillColor('#000000');
    doc.text(`Model: ${booking.vehicle.model}`, 70, doc.y + 5);
    doc.text(`Year: ${booking.vehicle.year}`, 70, doc.y);
    doc.text(`License Plate: ${booking.vehicle.plate}`, 70, doc.y);
    doc.moveDown(2);

    // Section: Advisor Information - Pure black headers, pure black content
    doc.font('Times-Bold').fontSize(13).fillColor('#000000').text('ADVISOR INFORMATION', 50, doc.y + 5);
    doc.font('Times-Roman').fontSize(10).fillColor('#000000');
    if (booking.advisor) {
      doc.text(`Name: ${booking.advisor.name}`, 70, doc.y + 5);
      doc.text(`Email: ${booking.advisor.email}`, 70, doc.y);
      doc.text(`Phone: ${booking.advisor.phone}`, 70, doc.y);
    } else {
      doc.text('Not assigned yet', 70, doc.y + 5);
    }
    doc.moveDown(2);

    // Section: Timeline - Pure black headers, pure black content
    doc.font('Times-Bold').fontSize(13).fillColor('#000000').text('TIMELINE', 50, doc.y + 5);
    doc.font('Times-Roman').fontSize(10).fillColor('#000000');
    doc.text(`Booked At: ${new Date(booking.createdAt).toLocaleString()}`, 70, doc.y + 5);
    if (booking.canModifyUntil) doc.text(`Can Modify Until: ${new Date(booking.canModifyUntil).toLocaleString()}`, 70, doc.y);
    if (booking.serviceStartTime) doc.text(`Service Start: ${new Date(booking.serviceStartTime).toLocaleString()}`, 70, doc.y);
    if (booking.serviceEndTime) doc.text(`Service End: ${new Date(booking.serviceEndTime).toLocaleString()}`, 70, doc.y);
    if (booking.queuePosition) doc.text(`Queue Position: #${booking.queuePosition}`, 70, doc.y);
    if (booking.queueStartTime) doc.text(`Queue Start: ${new Date(booking.queueStartTime).toLocaleString()}`, 70, doc.y);
    if (booking.estimatedServiceTime) doc.text(`Estimated Service: ${new Date(booking.estimatedServiceTime).toLocaleString()}`, 70, doc.y);
    doc.moveDown(2);

    // Section: Notes - Pure black headers, pure black content
    if (booking.notes) {
      doc.font('Times-Bold').fontSize(13).fillColor('#000000').text('NOTES', 50, doc.y + 5);
      doc.font('Times-Roman').fontSize(10).fillColor('#000000').text(booking.notes, 70, doc.y + 5);
      doc.moveDown(0.5);
    }

    // Footer - Properly aligned and centered with compact spacing
    doc.moveDown(6);
    
    // Add decorative line
    doc.moveTo(50, doc.y + 10).lineTo(545, doc.y + 10).lineWidth(1.5).strokeColor('#444444').stroke();
    doc.moveDown(2);
    
    // Footer text - properly centered and aligned
    doc.font('Times-Roman').fontSize(9).fillColor('#000000');
    doc.text('Thank you for choosing AUTO ELITE for your automotive service needs.', { align: 'center' });
    doc.moveDown(0.3);
    doc.text('Premium Service • Professional Care • Elite Experience', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
    // --- PDF BEAUTIFICATION END ---

    // Finalize PDF
    doc.end();
    console.log('✅ PDF report generated successfully');

  } catch (error) {
    console.error('❌ Error in generatePDFReport:', error);
    
    // Only send error response if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Failed to generate PDF report',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      // If headers already sent, end the response properly
      res.end();
    }
  }
};

// Get all bookings for staff management
const getAllBookings = async (req, res) => {
  try {
    // Check if user is authorized to view all bookings
    if (!['admin', 'manager', 'advisor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to view all bookings' });
    }

    const bookings = await Booking.find({})
      .populate('user', 'name email phone')
      .populate('advisor', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      bookings: bookings
    });

  } catch (error) {
    console.error('Error fetching all bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
};

export {
  createBooking,
  myBookings,
  updateBooking,
  cancelBooking,
  assignAdvisor,
  bookedSlots,
  getAvailableSlots,
  completeService,
  freeSlot,
  getQueueInfo,
  processQueueManually,
  debugSlotInfo,
  getAllBookings,
  generateBookingReport,
  generatePDFReport
};
