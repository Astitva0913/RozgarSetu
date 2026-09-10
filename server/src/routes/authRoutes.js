import { Router } from 'express';
import {
  sendOtpHandler,
  verifyOtpHandler,
  firebaseAuthHandler,
  logoutHandler,
  getMeHandler,
} from '../controllers/authController.js';
import { adminLoginHandler } from '../controllers/adminAuthController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Development Mock OTP routes
router.post('/send-otp', sendOtpHandler);
router.post('/verify-otp', verifyOtpHandler);

// Firebase Auth route (preserved for production)
router.post('/firebase', firebaseAuthHandler);

// Admin & Session routes
router.post('/admin/login', adminLoginHandler);
router.post('/logout', logoutHandler);
router.get('/me', authenticate, getMeHandler);

export default router;
