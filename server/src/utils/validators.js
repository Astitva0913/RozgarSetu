import AppError from './AppError.js';

const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = ['worker', 'customer'];

export const normalizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') {
    throw new AppError('Phone number is required');
  }

  const digits = phone.replace(/\D/g, '').slice(-10);

  if (!PHONE_REGEX.test(digits)) {
    throw new AppError('Enter a valid 10-digit Indian phone number');
  }

  return digits;
};

export const validateOtp = (otp) => {
  if (!otp || typeof otp !== 'string') {
    throw new AppError('OTP is required');
  }

  const trimmed = otp.trim();

  if (!OTP_REGEX.test(trimmed)) {
    throw new AppError('OTP must be a 6-digit number');
  }

  return trimmed;
};

export const validateRole = (role) => {
  if (!role || !VALID_ROLES.includes(role)) {
    throw new AppError('Role must be either worker or customer');
  }

  return role;
};

export const validateName = (name) => {
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    throw new AppError('Name must be at least 2 characters');
  }

  return name.trim();
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError('Enter a valid email address');
  }

  return email.trim().toLowerCase();
};

export const validatePassword = (password) => {
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new AppError('Password must be at least 6 characters');
  }

  return password;
};
