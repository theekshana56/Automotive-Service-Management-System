import express from 'express';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Get all brands
router.get('/', auth, async (req, res) => {
  try {
    // For now, return empty array until Brand model is implemented
    res.json([]);
  } catch (err) {
    console.error('getBrands error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new brand
router.post('/', auth, async (req, res) => {
  try {
    // For now, return not implemented
    res.status(501).json({ message: 'Brand creation not implemented yet' });
  } catch (err) {
    console.error('createBrand error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
