// server/utils/logAudit.js
const AuditLog = require("../models/AuditLog");

async function logAudit({ userId, entityType, entityId, action, before, after }) {
  return AuditLog.create({ userId, entityType, entityId, action, before, after });
}

module.exports = { logAudit };
