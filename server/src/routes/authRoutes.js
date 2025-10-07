import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimit.js';
import { login, register, me, logout, requestPasswordReset, resetPassword } from '../controllers/authController.js';

import authRequired from '../middleware/auth.js';

import { testSMTPConnection } from '../utils/email.js';
import User from '../models/User.js';
import crypto from 'crypto';


// Multer setup for avatar upload
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const r = Router();
// Multer local storage (same as userRoutes.js)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (_req, file, cb) => {
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.mimetype)) return cb(new Error('Only images allowed'));
    cb(null, true);
  }
});

r.post('/register', authLimiter, upload.single('avatar'), register);
r.post('/login', authLimiter, login);
r.get('/me', authRequired, me);
r.post('/logout', authRequired, logout);
r.post('/request-reset', requestPasswordReset);

r.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (!user.resetOTP) {
      console.log('No reset OTP found for user:', user._id);
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    if (user.resetOTP.code !== otp) {
      console.log('Invalid OTP provided for user:', user._id);
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date() > new Date(user.resetOTP.expiresAt)) {
      console.log('Expired OTP for user:', user._id);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Generate a verification token for the next step
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Store the verification token temporarily (you might want to use Redis or a similar store for production)
    user.verificationToken = verificationToken;
    user.verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    console.log('OTP verified successfully for user:', user._id);

    res.json({
      valid: true,
      message: 'OTP verified successfully',
      token: verificationToken
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
r.post('/reset-password', resetPassword);
r.get('/test-smtp', async (req, res) => {
  try {
    const result = await testSMTPConnection();
    res.json({ success: result, message: result ? 'SMTP connection successful' : 'SMTP connection failed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default r;
