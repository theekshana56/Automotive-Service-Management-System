import LedgerEntry from '../models/LedgerEntry';


// Get all audit logs with filters and pagination
export const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, entityType, entityId, action, startDate, endDate } = req.query;
    
    const query = {};
    
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;
    if (action) query.action = action;
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await LedgerEntry.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');
    
    const total = await LedgerEntry.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get audit log by ID
export const getAuditLogById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const log = await LedgerEntry.findById(id).populate('userId', 'name email');
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log not found' });
    }
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get audit logs for a specific entity
export const getEntityAuditLogs = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const query = { entityType, entityId };
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await LedgerEntry.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email');
    
    const total = await LedgerEntry.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to create audit log (used by other controllers)
export const createAuditLog = async (userId, action, entityType, entityId, details = {}) => {
  try {
    const auditLog = new LedgerEntry({
      userId,
      action,
      entityType,
      entityId,
      details,
      timestamp: new Date()
    });
    
    await auditLog.save();
    return auditLog;
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error as audit logging shouldn't break main functionality
    return null;
  }
};
