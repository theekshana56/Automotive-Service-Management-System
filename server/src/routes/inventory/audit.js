import express from 'express';
import InventoryAuditLog from '../../models/inventory/AuditLog.js';
import User from '../../models/User.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Get audit logs with pagination and filtering
router.get("/", auth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      entityType, 
      action, 
      userId,
      startDate,
      endDate,
      entityId 
    } = req.query;

    const filter = {};

    // Apply filters
    if (entityType) filter.entityType = entityType;
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (entityId) filter.entityId = entityId;

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get audit logs with user population
    const auditLogs = await InventoryAuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await InventoryAuditLog.countDocuments(filter);

    res.json({
      items: auditLogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("getAuditLogs error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get audit log by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const auditLog = await InventoryAuditLog.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!auditLog) {
      return res.status(404).json({ message: "Audit log not found" });
    }

    res.json(auditLog);
  } catch (err) {
    console.error("getAuditLogById error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Get audit summary statistics
router.get("/summary/stats", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};

    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) dateFilter.$lte = new Date(endDate);
    }

    const filter = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    // Get counts by entity type
    const entityTypeStats = await InventoryAuditLog.aggregate([
      { $match: filter },
      { $group: { _id: "$entityType", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get counts by action
    const actionStats = await InventoryAuditLog.aggregate([
      { $match: filter },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent activity
    const recentActivity = await InventoryAuditLog.find(filter)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      entityTypeStats,
      actionStats,
      recentActivity,
      totalLogs: await InventoryAuditLog.countDocuments(filter)
    });
  } catch (err) {
    console.error("getAuditSummary error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;