import express from 'express';
import {
  register,
  login,
  validateToken,
  refreshToken,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
  logout
} from '../../controllers/finance/authController.js';
import { protect } from '../../middleware/finance/auth.js';

const router = express.Router();

// Public routes
// Login route
router.post('/login', login);

// Register route (only for finance managers)
router.post('/register', register);

// Protected routes
// Validate token route
router.get('/validate', protect, validateToken);

// Refresh token route
router.post('/refresh-token', protect, refreshToken);

// Get current user profile
router.get('/me', protect, getMe);

// Get user profile
router.get('/profile', protect, getProfile);

// Update user profile
router.put('/profile', protect, updateProfile);

// Change password
router.put('/change-password', protect, changePassword);

// Logout route
router.post('/logout', protect, logout);

export default router;
