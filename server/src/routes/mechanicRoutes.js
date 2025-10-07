import { Router } from 'express';
import authRequired from '../middleware/auth.js';
import {
  registerMechanic,
  findNearbyMechanics,
  updateLocation,
  updateAvailability,
  getMechanicProfile
} from '../controllers/mechanicController.js';

const router = Router();

// Public routes (no authentication required)
router.post('/register', registerMechanic); // Register as mechanic
router.get('/nearby', findNearbyMechanics); // Find nearby mechanics

// Protected routes (authentication required)
router.get('/profile/:mechanicId', authRequired, getMechanicProfile); // Get mechanic profile
router.put('/location/:mechanicId', authRequired, updateLocation); // Update mechanic location
router.put('/availability/:mechanicId', authRequired, updateAvailability); // Update mechanic availability

export default router;
