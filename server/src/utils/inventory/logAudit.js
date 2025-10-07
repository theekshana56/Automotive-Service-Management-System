// server/utils/logAudit.js
import AuditLog from "../../models/inventory/AuditLog.js";

export async function logAudit({ userId, entityType, entityId, action, before, after, details }) {
  return AuditLog.create({ 
    actor: userId, 
    action, 
    meta: { 
      entityType, 
      entityId, 
      before, 
      after, 
      details 
    } 
  });
}
