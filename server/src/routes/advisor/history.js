import express from 'express';
import Booking from '../../models/Booking.js';
import User from '../../models/User.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Get advisor's work history
router.get('/history', auth, async (req, res, next) => {
  try {
    const { dateFrom, dateTo, status, serviceType, search } = req.query;
    const advisorId = req.user.id;

    // Build filter object
    const filter = { advisor: advisorId };

    // Date range filter (Booking.date is stored as YYYY-MM-DD string)
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = dateFrom; // compare as string
      if (dateTo) filter.date.$lte = dateTo;
    }

    // Status filter with normalization from UI values
    if (status && status !== 'all') {
      const map = {
        'completed': 'Completed',
        'in_progress': 'In Progress',
        'in-progress': 'In Progress',
        'in progress': 'In Progress',
        'cancelled': 'Cancelled',
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'queued': 'Queued'
      };
      const normalized = map[String(status).toLowerCase()] || status;
      filter.status = normalized;
    }

    // Service type filter
    if (serviceType && serviceType !== 'all') {
      filter.serviceType = serviceType;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { serviceType: { $regex: search, $options: 'i' } },
        { 'vehicle.model': { $regex: search, $options: 'i' } },
        { 'vehicle.plate': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch bookings with customer details
    const bookings = await Booking.find(filter)
      .populate('user', 'name email phone')
      .sort({ date: -1, timeSlot: -1 })
      .limit(100);

    // Calculate statistics
    const totalJobs = await Booking.countDocuments({ advisor: advisorId });
    const completedJobs = await Booking.countDocuments({ 
      advisor: advisorId, 
      status: 'completed' 
    });

    // Calculate total revenue (sum of completed jobs)
    const revenueResult = await Booking.aggregate([
      { $match: { advisor: advisorId, status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalCost' } } }
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

    // For now, we'll use a placeholder for average rating
    // In a real system, you'd have a separate ratings/reviews collection
    const averageRating = 4.8;

    // Format bookings for frontend
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      serviceType: booking.serviceType,
      customer: {
        name: booking.user?.name || 'Unknown',
        phone: booking.user?.phone || 'N/A',
        email: booking.user?.email || 'N/A'
      },
      vehicle: booking.vehicle,
      date: booking.date,
      timeSlot: booking.timeSlot,
      status: booking.status,
      totalCost: booking.totalCost || 0,
      notes: booking.notes,
      createdAt: booking.createdAt
    }));

    res.json({
      bookings: formattedBookings,
      stats: {
        totalJobs,
        completedJobs,
        totalRevenue,
        averageRating
      }
    });

  } catch (error) {
    console.error('Error fetching advisor history:', error);
    next(error);
  }
});

// Get advisor's performance metrics
router.get('/performance', auth, async (req, res, next) => {
  try {
    const advisorId = req.user.id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get bookings in the specified period
    const bookings = await Booking.find({
      advisor: advisorId,
      date: { $gte: startDate }
    }).sort({ date: -1 });

    // Calculate metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

    // Calculate revenue
    const totalRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalCost || 0), 0);

    // Service type breakdown
    const serviceBreakdown = {};
    bookings.forEach(booking => {
      if (booking.status === 'completed') {
        serviceBreakdown[booking.serviceType] = (serviceBreakdown[booking.serviceType] || 0) + 1;
      }
    });

    res.json({
      period: parseInt(period),
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate: Math.round(completionRate * 100) / 100,
      totalRevenue,
      serviceBreakdown
    });

  } catch (error) {
    console.error('Error fetching advisor performance:', error);
    next(error);
  }
});

export default router;
