import jwt from 'jsonwebtoken';
import env from '../config/env.js';

export const signToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

export const getCookieOptions = () => {
  const maxAgeMs = parseExpiryToMs(env.jwtExpiresIn);

  return {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
  };
};

const parseExpiryToMs = (expiry) => {
  const match = /^(\d+)([dhms])$/.exec(expiry);

  if (!match) {
    return 7 * 24 * 60 * 60 * 1000;
  }

  const value = Number(match[1]);
  const unit = match[2];

  const multipliers = {
    d: 24 * 60 * 60 * 1000,
    h: 60 * 60 * 1000,
    m: 60 * 1000,
    s: 1000,
  };

  return value * multipliers[unit];
};

export const setAuthCookie = (res, token) => {
  res.cookie('token', token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: 'lax',
  });
};
