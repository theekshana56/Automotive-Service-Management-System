import InventoryAuditLog from '../models/inventory/AuditLog.js';

/**
 * Log an audit entry
 * @param {Object} options - Audit log options
 * @param {string} options.userId - User ID performing the action
 * @param {string} options.entityType - Type of entity (Part, Supplier, etc.)
 * @param {string} options.entityId - ID of the entity
 * @param {string} options.action - Action performed (create, update, delete)
 * @param {Object} options.before - State before the action
 * @param {Object} options.after - State after the action
 * @param {string} options.source - Source of the action (UI, API, etc.)
 */
async function logAudit({ userId, entityType, entityId, action, before, after, source = 'API' }) {
  try {
    const auditEntry = new InventoryAuditLog({
      userId,
      entityType,
      entityId,
      action,
      before,
      after,
      source
    });

    await auditEntry.save();
    console.log(`📝 Audit logged: ${action} ${entityType} ${entityId} by user ${userId}`);
    return auditEntry;
  } catch (error) {
    console.error('❌ Failed to log audit entry:', error);
    // Don't throw error to avoid breaking the main operation
    return null;
  }
}

export { logAudit };