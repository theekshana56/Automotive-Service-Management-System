import express from 'express';
import auth from '../../middleware/auth.js';

const router = express.Router();

// Get all vehicle models
router.get('/', auth, async (req, res) => {
  try {
    // For now, return empty array until VehicleModel is implemented
    res.json([]);
  } catch (err) {
    console.error('getVehicleModels error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new vehicle model
router.post('/', auth, async (req, res) => {
  try {
    // For now, return not implemented
    res.status(501).json({ message: 'Vehicle model creation not implemented yet' });
  } catch (err) {
    console.error('createVehicleModel error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
