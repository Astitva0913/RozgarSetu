import Razorpay from 'razorpay';
import crypto from 'crypto';
import env from '../config/env.js';
import AppError from '../utils/AppError.js';

let razorpayClient = null;

/**
 * Check if Razorpay API keys are configured in environment variables.
 * @returns {boolean}
 */
export const isRazorpayConfigured = () => {
  return Boolean(
    env.razorpayKeyId &&
    env.razorpayKeySecret &&
    env.razorpayKeyId.trim().length > 0 &&
    env.razorpayKeySecret.trim().length > 0
  );
};

/**
 * Returns a configured Razorpay client instance.
 * Throws AppError with 503 status if credentials are not configured.
 * @returns {Razorpay}
 */
export const getRazorpayClient = () => {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server .env file.',
      503
    );
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpayKeyId.trim(),
      key_secret: env.razorpayKeySecret.trim(),
    });
  }

  return razorpayClient;
};

/**
 * Creates a Razorpay order on the server.
 * @param {object} params
 * @param {number} params.amount - Amount in INR
 * @param {string} [params.currency='INR'] - Currency code
 * @param {string} params.receipt - Short unique receipt identifier
 * @param {object} [params.notes={}] - Optional metadata key-value pairs
 * @returns {Promise<object>} Razorpay order object
 */
export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes = {} }) => {
  const rzp = getRazorpayClient();

  // Razorpay requires amounts in the smallest currency sub-unit (paise for INR)
  const amountInPaise = Math.round(amount * 100);

  if (amountInPaise <= 0) {
    throw new AppError('Order amount must be greater than zero', 400);
  }

  if (amount > env.paymentLimit) {
    throw new AppError(`Payment amount exceeds the maximum limit of ₹${env.paymentLimit.toLocaleString('en-IN')}`, 400);
  }

  try {
    const order = await rzp.orders.create({
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: String(receipt).slice(0, 40), // Razorpay max receipt length is 40 chars
      notes,
    });

    return order;
  } catch (error) {
    console.error('[Razorpay Order Error]:', error);
    const msg = error?.error?.description || error?.message || 'Failed to create payment order with Razorpay';
    throw new AppError(msg, 502);
  }
};

/**
 * Cryptographically verifies the Razorpay payment signature using HMAC SHA256.
 * @param {object} params
 * @param {string} params.razorpayOrderId
 * @param {string} params.razorpayPaymentId
 * @param {string} params.razorpaySignature
 * @returns {boolean} True if signature is authentic
 */
export const verifyRazorpaySignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      'Razorpay credentials are not configured. Cannot verify payment signature.',
      503
    );
  }

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  try {
    const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', env.razorpayKeySecret.trim())
      .update(payload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const providedBuffer = Buffer.from(razorpaySignature, 'utf8');

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  } catch (err) {
    console.error('[Razorpay Signature Verification Error]:', err);
    return false;
  }
};

/**
 * Fetches verified payment details from Razorpay by payment ID.
 * @param {string} paymentId - Razorpay payment ID (e.g. pay_XXXXX)
 * @returns {Promise<object|null>} Razorpay payment entity or null if not found
 */
export const fetchRazorpayPayment = async (paymentId) => {
  if (!isRazorpayConfigured()) {
    throw new AppError(
      'Razorpay credentials are not configured. Cannot fetch payment details.',
      503
    );
  }

  if (!paymentId || typeof paymentId !== 'string') {
    return null;
  }

  try {
    const rzp = getRazorpayClient();
    const payment = await rzp.payments.fetch(paymentId.trim());
    return payment;
  } catch (err) {
    console.warn(`[Razorpay Fetch Payment Warning]: Could not fetch payment ${paymentId}:`, err?.message || err);
    return null;
  }
};

