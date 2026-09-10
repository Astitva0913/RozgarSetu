import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import { verifyFirebaseIdToken } from '../config/firebase.js';
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} from '../services/jwtService.js';
import {
  normalizePhone,
  validateOtp,
  validateRole,
  validateName,
} from '../utils/validators.js';

/**
 * ========================================================================
 * DEVELOPMENT ONLY: Mock OTP Send Handler
 * Accepts phone & role, validates them, and generates mock OTP 123456.
 * Easy to replace with real SMS gateway provider (Twilio/Firebase/Fast2SMS).
 * ========================================================================
 */
export const sendOtpHandler = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const role = validateRole(req.body.role);

    const existingUser = await User.findOne({ phone });

    if (existingUser?.role === 'admin') {
      throw new AppError('Admin accounts cannot use phone OTP login', 400);
    }

    if (existingUser && existingUser.role !== role) {
      throw new AppError(
        `This phone number is already registered as a ${existingUser.role}. Please sign in as a ${existingUser.role}.`,
        400
      );
    }

    // Development only: mock OTP 123456 logged to console
    console.log(`[DEVELOPMENT MOCK OTP] Phone: +91${phone} | Role: ${role} | OTP: 123456`);

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully. (Development mode: use 123456)',
      isExistingUser: !!existingUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * ========================================================================
 * DEVELOPMENT ONLY: Mock OTP Verification Handler
 * Strictly verifies OTP === '123456', finds/creates user, enforces role integrity,
 * and generates the standard JWT stored in an HTTP-only cookie.
 * ========================================================================
 */
export const verifyOtpHandler = async (req, res, next) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const otp = validateOtp(req.body.otp);
    const role = validateRole(req.body.role);

    const MOCK_OTP = '123456';
    if (otp !== MOCK_OTP) {
      throw new AppError('Invalid OTP. Please enter 123456 for development login.', 400);
    }

    let user = await User.findOne({ phone });
    const isExistingUser = !!user;

    if (user) {
      if (user.role === 'admin') {
        throw new AppError('Admin accounts cannot use phone OTP login', 403);
      }

      if (user.role !== role) {
        throw new AppError(
          `This phone number is already registered as a ${user.role}. Please sign in as a ${user.role}.`,
          400
        );
      }

      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    } else {
      const validatedName = validateName(req.body.name || 'RozgaarSetu User');
      user = await User.create({
        phone,
        name: validatedName,
        role,
        isVerified: true,
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Authenticated successfully',
      isNewUser: !isExistingUser,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Firebase ID Token Auth Handler (Preserved for future production use)
 */
export const firebaseAuthHandler = async (req, res, next) => {
  try {
    const { idToken, name, role } = req.body;

    if (!idToken || typeof idToken !== 'string') {
      throw new AppError('Firebase ID token is required', 400);
    }

    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (firebaseErr) {
      console.error('[Firebase Token Verification Error]:', firebaseErr.message);
      throw new AppError('Invalid or expired Firebase token. Please sign in again.', 401);
    }

    const { uid } = decodedToken;
    const rawPhone = decodedToken.phone_number || decodedToken.firebase?.identities?.phone?.[0];

    if (!rawPhone) {
      throw new AppError('No phone number associated with this Firebase account', 400);
    }

    const phone = normalizePhone(rawPhone);

    let user = await User.findOne({
      $or: [{ firebaseUid: uid }, { phone }],
    });

    const isExistingUser = !!user;

    if (user) {
      if (user.role === 'admin') {
        throw new AppError('Admin accounts cannot use phone authentication', 403);
      }

      let shouldSave = false;
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        shouldSave = true;
      }
      if (!user.isVerified) {
        user.isVerified = true;
        shouldSave = true;
      }
      if (shouldSave) {
        await user.save();
      }
    } else {
      const validatedName = validateName(name || 'RozgaarSetu User');
      const validatedRole = validateRole(role || 'customer');

      user = await User.create({
        firebaseUid: uid,
        phone,
        name: validatedName,
        role: validatedRole,
        isVerified: true,
      });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Authentication successful',
      isNewUser: !isExistingUser,
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const logoutHandler = (req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMeHandler = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toPublicJSON(),
  });
};
