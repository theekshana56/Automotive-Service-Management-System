import express from 'express';
import Notification from '../../models/inventory/Notification.js';
import auth from '../../middleware/auth.js';

const router = express.Router();

// List notifications (latest first)
router.get('/', auth, async (req, res, next) => {
  try {
    const { unreadOnly } = req.query;
    console.log('Fetching notifications for user:', req.user.id, 'unreadOnly:', unreadOnly);
    
    const filter = {
      $or: [
        { userId: req.user.id },
        { userId: null }
      ]
    };
    if (String(unreadOnly) === '1') filter.read = false;
    
    const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    console.log('Found notifications:', items.length);
    res.json({ items });
  } catch (e) { 
    console.error('Error fetching notifications:', e);
    next(e); 
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const n = await Notification.findOneAndDelete({ _id: req.params.id, $or: [{ userId: req.user.id }, { userId: null }] });
    if (!n) return res.status(404).json({ error: 'Notification not found' });
    res.json({ ok: true });
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
    await Notification.updateMany({ read: false, userId: req.user.id }, { $set: { read: true, readAt: new Date() } });
    res.json({ ok: true });
  } catch (e) { 
    next(e); 
  }
});

// Get unread count
router.get('/unread-count', auth, async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ read: false, userId: req.user.id });
    res.json({ count });
  } catch (e) { 
    next(e); 
  }
});

// Test endpoint to check authentication
router.get('/test-auth', auth, async (req, res, next) => {
  try {
    res.json({ 
      message: 'Authentication successful',
      user: {
        id: req.user.id,
        role: req.user.role
      }
    });
  } catch (e) { 
    next(e); 
  }
});

export default router;