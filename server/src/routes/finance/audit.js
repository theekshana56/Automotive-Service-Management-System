import express from 'express';
import auditController from '../controllers/auditController';

const router = express.Router();

const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/auth');

// All routes require authentication and finance manager role
router.use(protect, authorize('finance_manager', 'admin'));

// Get all audit logs with filters and pagination
router.get('/', auditController.getAuditLogs);

// Get audit log by ID
router.get('/:id', auditController.getAuditLogById);

// Get audit logs for a specific entity
router.get('/entity/:entityType/:entityId', auditController.getEntityAuditLogs);

export default router;