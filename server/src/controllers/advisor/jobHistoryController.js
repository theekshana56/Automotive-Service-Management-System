import { 
  getJobHistoryByBooking, 
  getJobHistoryByAdvisor, 
  getJobStatistics,
  updateJobStatus 
} from '../../services/advisor/jobHistoryService.js';
import Booking from '../../models/Booking.js';
import Notification from '../../models/inventory/Notification.js';

// Get job history for a specific booking
export const getBookingHistory = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const advisorId = req.user.id;

    // Verify the advisor has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.advisor.toString() !== advisorId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to view this booking history' });
    }

    const history = await getJobHistoryByBooking(bookingId);
    res.json({ history });
  } catch (error) {
    console.error('Error fetching booking history:', error);
    next(error);
  }
};

// Get job history for advisor
export const getAdvisorJobHistory = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { status, dateFrom, dateTo, page, limit } = req.query;

    const filters = { status, dateFrom, dateTo, page, limit };
    const result = await getJobHistoryByAdvisor(advisorId, filters);

    res.json(result);
  } catch (error) {
    console.error('Error fetching advisor job history:', error);
    next(error);
  }
};

// Get job statistics for advisor
export const getAdvisorJobStatistics = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { startDate, endDate } = req.query;

    const dateRange = { startDate, endDate };
    const statistics = await getJobStatistics(advisorId, dateRange);

    res.json({ statistics });
  } catch (error) {
    console.error('Error fetching job statistics:', error);
    next(error);
  }
};

// Update job status manually
export const updateJobStatusManually = async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { bookingId } = req.params;
    const { newStatus, notes, estimatedCost, actualCost } = req.body;

    // Verify the advisor has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.advisor.toString() !== advisorId) {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    const { historyEntry } = await updateJobStatus(
      bookingId,
      newStatus,
      advisorId,
      {
        notes,
        estimatedCost,
        actualCost
      }
    );

    // Create notification for customer if status changed to completed
    if (newStatus === 'Completed') {
      await Notification.create({
        userId: booking.user,
        type: 'JOB_COMPLETED',
        title: 'Service Completed',
        message: `Your service for vehicle ${booking.vehicle.plate} has been completed successfully.`,
        link: `/my-bookings/${bookingId}`,
        meta: { bookingId }
      });
    }

    res.json({
      message: 'Job status updated successfully',
      historyEntry
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    next(error);
  }
};

// Get job timeline for a specific booking
export const getJobTimeline = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const advisorId = req.user.id;

    // Verify the advisor has access to this booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.advisor.toString() !== advisorId && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ message: 'Not authorized to view this booking timeline' });
    }

    const history = await getJobHistoryByBooking(bookingId);
    
    // Create timeline with additional booking information
    const timeline = [
      {
        id: 'booking-created',
        timestamp: booking.createdAt,
        status: 'Booking Created',
        description: `Booking created for ${booking.vehicle.plate}`,
        type: 'booking'
      },
      ...history.map(entry => ({
        id: entry._id,
        timestamp: entry.createdAt,
        status: entry.status,
        description: entry.description,
        notes: entry.notes,
        type: 'status-change',
        advisor: entry.advisorId
      }))
    ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({ timeline });
  } catch (error) {
    console.error('Error fetching job timeline:', error);
    next(error);
  }
};
