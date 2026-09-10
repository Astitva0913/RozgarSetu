import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import AppError from '../utils/AppError.js';
import {
  signToken,
  setAuthCookie,
} from '../services/jwtService.js';
import {
  validateEmail,
  validatePassword,
} from '../utils/validators.js';

export const adminLoginHandler = async (req, res, next) => {
  try {
    const email = validateEmail(req.body.email);
    const password = validatePassword(req.body.password);

    const admin = await User.findOne({ email, role: 'admin' }).select('+password');

    if (!admin) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = signToken(admin);
    setAuthCookie(res, token);

    res.status(200).json({
      success: true,
      message: 'Admin logged in successfully',
      user: admin.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};
