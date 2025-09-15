import express from 'express';
import Notification from '../../models/inventory/Notification.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// List notifications (latest first)
router.get('/', auth, async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    const filter = {};
    if (String(unreadOnly) === '1') filter.read = false;
    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.json({ items });
  } catch (e) { 
    next(e); 
  }
});

// Mark notification as read
router.patch('/:id/read', auth, async (req, res, next) => {
  try {
    const n = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } },
      { new: true }
    );
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json(n);
  } catch (e) { 
    next(e); 
  }
});

// Mark all notifications as read
router.post('/read-all', auth, async (req, res, next) => {
  try {
    await Notification.updateMany({ read: false }, { $set: { read: true } });
    res.json({ ok: true });
  } catch (e) { 
    next(e); 
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.json({ count });
  } catch (e) { 
    next(e); 
  }
});

export default router;