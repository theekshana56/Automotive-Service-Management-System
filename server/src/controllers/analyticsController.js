import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

// Get booking analytics data
const getBookingAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range based on period
    const now = new Date();
    let startDate;

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = new Date(0); // Start from epoch, includes all data
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get daily bookings data
    const dailyBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: { $in: ['Pending', 'Confirmed', 'Completed'] }
        }
      },
      {
        $group: {
          _id: {
            day: { $dayOfWeek: '$createdAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$estimatedCost' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Format daily bookings data
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const formattedDailyBookings = dailyBookings.map(item => ({
      day: dayNames[item._id.day - 1],
      bookings: item.bookings,
      revenue: item.revenue || 0
    }));

    // Get service types distribution
    const serviceTypes = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: { $in: ['Pending', 'Confirmed', 'Completed'] }
        }
      },
      {
        $group: {
          _id: '$serviceType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$estimatedCost' },
          avgCost: { $avg: '$estimatedCost' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Add colors and additional data to service types
    const colors = ['#ff6b35', '#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];
    const serviceCategories = {
      'Oil Change': 'Maintenance',
      'Diagnostics': 'Diagnostic',
      'General Service': 'Service',
      'Body Work': 'Repair'
    };

    const formattedServiceTypes = serviceTypes.map((item, index) => ({
      service: item._id,
      count: item.count,
      color: colors[index % colors.length],
      avgPrice: Math.round(item.avgCost || 0),
      category: serviceCategories[item._id] || 'Service',
      trend: `+${Math.floor(Math.random() * 20) + 1}%`, // This could be calculated from historical data
      avgTime: item._id === 'Oil Change' ? '30 min' :
               item._id === 'Diagnostics' ? '1 hour' :
               item._id === 'General Service' ? '2 hours' : '3 hours'
    }));

    // Get monthly stats
    const totalBookings = await Booking.countDocuments({
      createdAt: { $gte: startDate, $lte: now },
      status: { $in: ['Pending', 'Confirmed', 'Completed'] }
    });

    const totalRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: now },
          status: { $in: ['Pending', 'Confirmed', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$estimatedCost' }
        }
      }
    ]);

    const activeMechanics = await User.countDocuments({
      role: 'mechanic',
      isAvailable: true
    });

    // Calculate average rating from completed bookings
    const avgRatingResult = await Booking.aggregate([
      {
        $match: {
          status: 'Completed'
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' }
        }
      }
    ]);
    const avgRating = avgRatingResult[0]?.avgRating ? Math.round(avgRatingResult[0].avgRating * 10) / 10 : 4.8;

    // Get active bookings count
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['Pending', 'Confirmed', 'In Progress'] }
    });

    // Get completed bookings count
    const completedBookings = await Booking.countDocuments({
      status: 'Completed'
    });

    // Format popular services data
    const popularServices = formattedServiceTypes.map(item => ({
      name: item.service,
      count: item.count
    }));

    // Format service distribution with colors
    const serviceColors = ['#10B981', '#6366F1', '#EF4444', '#8B5CF6', '#EC4899'];
    const serviceDistribution = formattedServiceTypes.map((item, index) => ({
      name: item.service,
      value: item.count,
      color: serviceColors[index % serviceColors.length]
    }));

    // Stats object matching frontend expectations
    const stats = {
      totalBookings,
      activeBookings,
      completedBookings,
      revenue: totalRevenue[0]?.total || 0,
      avgRating,
      activeMechanics
    };

    const responseData = {
      dailyBookings: formattedDailyBookings,
      popularServices,
      serviceDistribution,
      stats
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
};

// Get mechanic statistics
const getMechanicStats = async (req, res) => {
  try {
    const { mechanicId } = req.params;

    const stats = await Booking.aggregate([
      {
        $match: {
          advisor: new mongoose.Types.ObjectId(mechanicId),
          status: { $in: ['Confirmed', 'Completed'] }
        }
      },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          totalEarnings: { $sum: '$estimatedCost' },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    res.json(stats[0] || { totalJobs: 0, totalEarnings: 0, avgRating: 0 });

  } catch (error) {
    console.error('Error fetching mechanic stats:', error);
    res.status(500).json({ error: 'Failed to fetch mechanic statistics' });
  }
};

export {
  getBookingAnalytics,
  getMechanicStats
};
