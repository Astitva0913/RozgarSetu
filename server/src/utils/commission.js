import env from '../config/env.js';
import AppError from './AppError.js';

/**
 * Calculates platform commission and worker earnings server-side.
 * @param {number} amount - Total job amount in INR
 * @param {number} [rate] - Commission rate as a decimal (e.g., 0.10 for 10%)
 * @returns {{ rate: number, platformCommission: number, workerAmount: number }}
 */
export const calculateCommission = (amount, rate = env.commissionRate) => {
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) {
    throw new AppError('Invalid job amount for commission calculation', 400);
  }

  const effectiveRate = typeof rate === 'number' && !Number.isNaN(rate) && rate >= 0 && rate <= 1
    ? rate
    : 0.10;

  // Calculate platform commission rounded to 2 decimal places
  const platformCommission = Math.round(amount * effectiveRate * 100) / 100;

  // Worker receives remaining balance
  const workerAmount = Math.round((amount - platformCommission) * 100) / 100;

  return {
    rate: effectiveRate,
    platformCommission,
    workerAmount,
  };
};

export default calculateCommission;
