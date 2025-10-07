import Inspection from '../../models/advisor/Inspection.js';
import Booking from '../../models/Booking.js';
import Notification from '../../models/inventory/Notification.js';
import { updateJobStatus } from '../../services/advisor/jobHistoryService.js';
import { emitToRole } from '../../services/notificationService.js';

// Get pending jobs for advisor
export const getPendingJobs = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    console.log('🔍 Getting pending jobs for advisor:', advisorId);
    
    // Get bookings assigned to this advisor that are pending or confirmed
    const pendingBookings = await Booking.find({
      advisor: advisorId,
      status: { $in: ['Confirmed', 'Pending'] }
    })
    .populate('user', 'name phone email')
    .sort({ date: 1, timeSlot: 1 });

    console.log('📋 Found pending bookings:', pendingBookings.length);
    console.log('📋 Bookings data:', pendingBookings.map(b => ({
      id: b._id,
      status: b.status,
      vehiclePlate: b.vehicle?.plate,
      serviceType: b.serviceType
    })));

    // Transform bookings to job format
    const pendingJobs = pendingBookings.map(booking => ({
      id: booking._id,
      vehiclePlate: booking.vehicle.plate,
      customerName: booking.user.name,
      customerPhone: booking.user.phone,
      serviceType: booking.serviceType,
      date: booking.date,
      timeSlot: booking.timeSlot,
      priority: booking.priority || 'medium',
      notes: booking.notes || '',
      bookingId: booking._id,
      status: booking.status
    }));

    console.log('✅ Returning pending jobs:', pendingJobs.length);
    res.json({ jobs: pendingJobs });
  } catch (error) {
    console.error('Error fetching pending jobs:', error);
    next(error);
  }
};

// Create new inspection
export const createInspection = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { bookingId, inspectionData } = req.body;

    // Verify booking exists and is assigned to this advisor
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.advisor.toString() !== advisorId) {
      return res.status(403).json({ message: 'Not authorized to inspect this booking' });
    }

    // Check if inspection already exists
    const existingInspection = await Inspection.findOne({ bookingId });
    if (existingInspection) {
      return res.status(400).json({ message: 'Inspection already exists for this booking' });
    }

    // Create inspection
    const inspection = new Inspection({
      bookingId,
      advisorId,
      vehiclePlate: inspectionData.vehiclePlate,
      jobType: inspectionData.jobType,
      inspectionItems: {
        engineOil: inspectionData.engineOil,
        brakeFluid: inspectionData.brakeFluid,
        coolant: inspectionData.coolant,
        battery: inspectionData.battery,
        tires: inspectionData.tires || undefined,
        lights: inspectionData.lights || undefined,
        airFilter: inspectionData.airFilter || undefined,
        transmissionFluid: inspectionData.transmissionFluid || undefined
      },
      notes: inspectionData.notes,
      recommendations: inspectionData.recommendations || [],
      status: 'in-progress',
      estimatedDuration: inspectionData.estimatedDuration || 60
    });

    await inspection.save();

    // Update booking status and create job history entry
    const { historyEntry } = await updateJobStatus(
      bookingId, 
      'In Progress', 
      advisorId, 
      {
        notes: `Inspection started for ${inspectionData.vehiclePlate}`,
        estimatedCost: inspectionData.estimatedCost || 0
      }
    );

    // Update booking with inspection ID
    booking.inspectionId = inspection._id;
    await booking.save();

    // Audit trail logging removed to fix validation errors

    // Create notification for customer
    await Notification.create({
      userId: booking.user,
      type: 'INSPECTION_STARTED',
      title: 'Vehicle Inspection Started',
      message: `Inspection for vehicle ${inspectionData.vehiclePlate} has been started by your service advisor.`,
      link: `/my-bookings/${bookingId}`,
      meta: { bookingId, inspectionId: inspection._id }
    });

    res.status(201).json({
      message: 'Inspection created successfully',
      inspection: inspection
    });
  } catch (error) {
    console.error('Error creating inspection:', error);
    next(error);
  }
};

// Update inspection
export const updateInspection = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    if (inspection.advisorId.toString() !== advisorId) {
      return res.status(403).json({ message: 'Not authorized to update this inspection' });
    }

    // Update inspection
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        inspection[key] = updateData[key];
      }
    });

    await inspection.save();

    // Audit trail logging removed to fix validation errors

    res.json({
      message: 'Inspection updated successfully',
      inspection: inspection
    });
  } catch (error) {
    console.error('Error updating inspection:', error);
    next(error);
  }
};

// Complete inspection
export const completeInspection = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { id } = req.params;
    const { recommendations, notes, actualDuration } = req.body;

    const inspection = await Inspection.findById(id);
    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    if (inspection.advisorId.toString() !== advisorId) {
      return res.status(403).json({ message: 'Not authorized to complete this inspection' });
    }

    // Update inspection
    inspection.status = 'completed';
    inspection.completedAt = new Date();
    inspection.actualDuration = actualDuration;
    if (recommendations) inspection.recommendations = recommendations;
    if (notes) inspection.notes = notes;

    await inspection.save();

    // Update booking status and create job history entry
    const booking = await Booking.findById(inspection.bookingId);
    if (booking) {
      await updateJobStatus(
        booking._id,
        'Completed',
        advisorId,
        {
          notes: `Inspection completed for ${inspection.vehiclePlate}`,
          recommendations: recommendations,
          actualCost: actualDuration * 0.5 // Example: $0.50 per minute
        }
      );
    }

    // Audit trail logging removed to fix validation errors

    // Create notification for customer
    await Notification.create({
      userId: booking.user,
      type: 'INSPECTION_COMPLETED',
      title: 'Vehicle Inspection Completed',
      message: `Inspection for vehicle ${inspection.vehiclePlate} has been completed. ${recommendations?.length || 0} recommendations provided.`,
      link: `/my-bookings/${booking._id}`,
      meta: { bookingId: booking._id, inspectionId: inspection._id }
    });

    // Emit real-time event so dashboards refresh
    try {
      emitToRole('advisor', 'inspection:completed', { bookingId: booking?._id, status: 'Completed' });
      emitToRole('service_advisor', 'inspection:completed', { bookingId: booking?._id, status: 'Completed' });
      emitToRole('service-advisor', 'inspection:completed', { bookingId: booking?._id, status: 'Completed' });
    } catch (_) {}

    res.json({
      message: 'Inspection completed successfully',
      inspection: inspection
    });
  } catch (error) {
    console.error('Error completing inspection:', error);
    next(error);
  }
};

// Get inspection by ID
export const getInspection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const advisorId = req.user.id;

    const inspection = await Inspection.findById(id)
      .populate('bookingId', 'user vehicle serviceType date timeSlot')
      .populate('advisorId', 'name email');

    if (!inspection) {
      return res.status(404).json({ message: 'Inspection not found' });
    }

    // Check authorization
    if (inspection.advisorId._id.toString() !== advisorId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to view this inspection' });
    }

    res.json({ inspection });
  } catch (error) {
    console.error('Error fetching inspection:', error);
    next(error);
  }
};

// Get inspections by advisor
export const getAdvisorInspections = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = req.query;

    const filter = { advisorId };
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const inspections = await Inspection.find(filter)
      .populate('bookingId', 'user vehicle serviceType date timeSlot')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Inspection.countDocuments(filter);

    res.json({
      inspections,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching advisor inspections:', error);
    next(error);
  }
};

// Delete booking
export const deleteBooking = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { id } = req.params;

    // Find the booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if the booking is assigned to this advisor
    if (booking.advisor.toString() !== advisorId) {
      return res.status(403).json({ message: 'Not authorized to delete this booking' });
    }

    // Delete associated inspection if it exists
    if (booking.inspectionId) {
      await Inspection.findByIdAndDelete(booking.inspectionId);
    }

    // Delete the booking
    await Booking.findByIdAndDelete(id);

    // Create notification for customer
    await Notification.create({
      userId: booking.user,
      type: 'JOB_CANCELLED',
      title: 'Service Cancelled',
      message: `Your service for vehicle ${booking.vehicle.plate} has been cancelled by your service advisor.`,
      link: `/my-bookings/${id}`,
      meta: { bookingId: id }
    });

    res.json({
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    next(error);
  }
};
