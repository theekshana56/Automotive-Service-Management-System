import express from 'express';
import AuditLog from '../models/AuditLog';
import auth from '../middleware/auth';

const router = express.Router();



router.get("/", auth, async (req, res) => {
  const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(100);
  res.json(logs);
});

export default router;
