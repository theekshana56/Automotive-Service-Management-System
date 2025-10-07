import Booking from '../../models/Booking.js';

export const getOverview = async (req, res) => {
  try {
    // Scope to the logged-in advisor
    const advisorId = req.user?.id;

    // Normalize filters
    const pendingStatuses = ['Pending', 'Confirmed', 'Queued', 'In Progress'];
    const completedStatuses = ['Completed', 'Inspection Complete'];

    // Counts for cards (filtered by advisor)
    const [pendingJobs, completedJobs] = await Promise.all([
      Booking.countDocuments({ advisor: advisorId, status: { $in: pendingStatuses } }),
      Booking.countDocuments({ advisor: advisorId, status: { $in: completedStatuses } })
    ]);

    // Bar chart: bookings per day for next 14 days
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 14);

    // Booking.date is YYYY-MM-DD string
    const toYMD = (d) => d.toISOString().slice(0,10);
    const startStr = toYMD(start);
    const endStr = toYMD(end);

    const upcoming = await Booking.find({ advisor: advisorId, date: { $gte: startStr, $lt: endStr } }, { date: 1 }).lean();
    const buckets = new Map();
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets.set(toYMD(d), 0);
    }
    for (const b of upcoming) {
      if (buckets.has(b.date)) buckets.set(b.date, buckets.get(b.date) + 1);
    }
    const next14Days = Array.from(buckets.entries()).map(([day, count]) => ({ day, count }));

    res.json({
      pendingJobs: pendingJobs || 0,
      completedJobs: completedJobs || 0,
      next14Days: next14Days || []
    });
  } catch (error) {
    console.error('Error fetching advisor overview:', error);
    res.status(500).json({
      message: 'Failed to fetch advisor overview',
      pendingJobs: 0,
      completedJobs: 0,
      next14Days: []
    });
  }
};
