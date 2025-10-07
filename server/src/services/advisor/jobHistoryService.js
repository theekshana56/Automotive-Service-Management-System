import JobHistory from '../../models/advisor/JobHistory.js';
import Booking from '../../models/Booking.js';
import Inspection from '../../models/advisor/Inspection.js';

// Create a job history entry
export const createJobHistoryEntry = async (data) => {
  try {
    const {
      bookingId,
      inspectionId,
      advisorId,
      customerId,
      vehiclePlate,
      serviceType,
      status,
      previousStatus,
      action,
      description,
      notes,
      duration,
      estimatedCost,
      actualCost,
      partsUsed,
      laborHours,
      laborRate,
      recommendations,
      customerApproval,
      completionNotes,
      qualityCheck,
      customerSatisfaction
    } = data;

    const jobHistoryEntry = new JobHistory({
      bookingId,
      inspectionId,
      advisorId,
      customerId,
      vehiclePlate,
      serviceType,
      status,
      previousStatus,
      action,
      description,
      notes,
      duration,
      estimatedCost,
      actualCost,
      partsUsed,
      laborHours,
      laborRate,
      recommendations,
      customerApproval,
      completionNotes,
      qualityCheck,
      customerSatisfaction
    });

    await jobHistoryEntry.save();

    // Audit trail logging removed to fix validation errors

    return jobHistoryEntry;
  } catch (error) {
    console.error('Error creating job history entry:', error);
    throw error;
  }
};

// Get job history for a specific booking
export const getJobHistoryByBooking = async (bookingId) => {
  try {
    const history = await JobHistory.find({ bookingId })
      .populate('advisorId', 'name email')
      .populate('customerId', 'name email')
      .sort({ createdAt: 1 });

    return history;
  } catch (error) {
    console.error('Error fetching job history:', error);
    throw error;
  }
};

// Get job history for an advisor
export const getJobHistoryByAdvisor = async (advisorId, filters = {}) => {
  try {
    const { status, dateFrom, dateTo, page = 1, limit = 10 } = filters;
    
    const query = { advisorId };
    
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const history = await JobHistory.find(query)
      .populate('bookingId', 'user vehicle serviceType date timeSlot')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobHistory.countDocuments(query);

    return {
      history,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    };
  } catch (error) {
    console.error('Error fetching advisor job history:', error);
    throw error;
  }
};

// Update job status and create history entry
export const updateJobStatus = async (bookingId, newStatus, advisorId, additionalData = {}) => {
  try {
    // Get current booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const previousStatus = booking.status;
    
    // Update booking status
    booking.status = newStatus;
    await booking.save();

    // Create job history entry
    const historyEntry = await createJobHistoryEntry({
      bookingId,
      inspectionId: booking.inspectionId,
      advisorId,
      customerId: booking.user,
      vehiclePlate: booking.vehicle.plate,
      serviceType: booking.serviceType,
      status: newStatus,
      previousStatus,
      action: getActionFromStatus(newStatus, previousStatus),
      description: getDescriptionFromStatus(newStatus, previousStatus),
      notes: additionalData.notes,
      duration: additionalData.duration,
      estimatedCost: additionalData.estimatedCost,
      actualCost: additionalData.actualCost,
      partsUsed: additionalData.partsUsed,
      laborHours: additionalData.laborHours,
      laborRate: additionalData.laborRate,
      recommendations: additionalData.recommendations,
      customerApproval: additionalData.customerApproval,
      completionNotes: additionalData.completionNotes,
      qualityCheck: additionalData.qualityCheck,
      customerSatisfaction: additionalData.customerSatisfaction
    });

    return { booking, historyEntry };
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
};

// Helper function to determine action from status change
const getActionFromStatus = (newStatus, previousStatus) => {
  const statusActionMap = {
    'Confirmed': 'BOOKING_CONFIRMED',
    'In Progress': 'INSPECTION_STARTED',
    'Inspection Complete': 'INSPECTION_COMPLETED',
    'Work In Progress': 'WORK_STARTED',
    'Completed': 'WORK_COMPLETED',
    'Cancelled': 'JOB_CANCELLED',
    'On Hold': 'JOB_ON_HOLD'
  };

  return statusActionMap[newStatus] || 'STATUS_UPDATED';
};

// Helper function to generate description from status change
const getDescriptionFromStatus = (newStatus, previousStatus) => {
  const descriptions = {
    'Confirmed': `Booking confirmed for ${previousStatus} status`,
    'In Progress': 'Vehicle inspection started',
    'Inspection Complete': 'Vehicle inspection completed',
    'Work In Progress': 'Repair work started',
    'Completed': 'Job completed successfully',
    'Cancelled': 'Job cancelled',
    'On Hold': 'Job put on hold'
  };

  return descriptions[newStatus] || `Status changed from ${previousStatus} to ${newStatus}`;
};

// Get job statistics for advisor
export const getJobStatistics = async (advisorId, dateRange = {}) => {
  try {
    const { startDate, endDate } = dateRange;
    const query = { advisorId };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const stats = await JobHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$actualCost' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const totalJobs = await JobHistory.countDocuments(query);
    const totalRevenue = await JobHistory.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$actualCost' } } }
    ]);

    return {
      totalJobs,
      totalRevenue: totalRevenue[0]?.total || 0,
      statusBreakdown: stats,
      averageRating: 4.8 // This would come from customer satisfaction ratings
    };
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    throw error;
  }
};
