const AuditLog = require('../models/AuditLog');

async function recordAudit(req, { action, entityType, entityId, details }) {
  await AuditLog.create({
    user: req.user ? req.user._id : undefined,
    action,
    entityType,
    entityId,
    details,
    ipAddress: req.ip,
  });
}

module.exports = { recordAudit };
