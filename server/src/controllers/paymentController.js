import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';
import env from '../config/env.js';
import { calculateCommission } from '../utils/commission.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  fetchRazorpayPayment,
  isRazorpayConfigured,
} from '../services/razorpayService.js';

const isValidId = (id) => mongoose.isValidObjectId(id);

/**
 * Customer creates a new payment order for an accepted worker on a job.
 * POST /api/v1/payments/create-order
 */
export const createOrderHandler = async (req, res, next) => {
  try {
    const { jobId, applicationId, paymentMethod } = req.body;

    if (!jobId || !isValidId(jobId)) {
      throw new AppError('A valid jobId is required', 400);
    }

    if (applicationId && !isValidId(applicationId)) {
      throw new AppError('Invalid applicationId', 400);
    }

    // 1. Ensure the job exists and is owned by the authenticated customer
    const job = await Job.findOne({ _id: jobId, customer: req.user._id });
    if (!job) {
      throw new AppError('Job not found or not owned by you', 404);
    }

    // 2. Prevent duplicate successful payments
    const existingPaid = await Payment.findOne({ job: jobId, status: 'paid' });
    if (existingPaid) {
      throw new AppError('This job has already been paid for.', 400);
    }

    // 2b. Workflow state check: Payment only available after completion is confirmed by customer
    if (job.workflowStatus !== 'customer_confirmed') {
      throw new AppError('Payment is only available after work is completed and confirmed by the customer.', 400);
    }

    // 3. Find the accepted application for this job
    const appFilter = { job: jobId, status: 'accepted' };
    if (applicationId) {
      appFilter._id = applicationId;
    }

    const application = await Application.findOne(appFilter).populate('worker', 'name phone email');
    if (!application) {
      throw new AppError('Payment is only allowed for jobs with an accepted worker application.', 400);
    }

    if (!application.worker) {
      throw new AppError('Accepted worker could not be found for this job.', 404);
    }

    // 4. Determine payable amount strictly from server-side job data
    const amount = Number(job.salary);
    if (!amount || amount <= 0) {
      throw new AppError('Job salary must be greater than zero to initiate payment', 400);
    }
    if (amount > env.paymentLimit) {
      throw new AppError(`Payment amount cannot exceed the maximum limit of ₹${env.paymentLimit.toLocaleString('en-IN')}`, 400);
    }

    // 5. Calculate commission server-side
    const { rate, platformCommission, workerAmount } = calculateCommission(amount, env.commissionRate);

    // 6. Check Razorpay configuration before calling gateway
    if (!isRazorpayConfigured()) {
      throw new AppError(
        'Razorpay credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server .env file.',
        503
      );
    }

    // 7. Create Razorpay order
    const receipt = `rcpt_${job._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`;
    const order = await createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt,
      notes: {
        jobId: job._id.toString(),
        customerId: req.user._id.toString(),
        workerId: application.worker._id.toString(),
      },
    });

    // 8. Record the pending payment in MongoDB
    const payment = await Payment.create({
      customer: req.user._id,
      worker: application.worker._id,
      job: job._id,
      application: application._id,
      amount,
      commissionRate: rate,
      platformCommission,
      workerAmount,
      currency: 'INR',
      razorpayOrderId: order.id,
      paymentMethod: 'upi',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: env.razorpayKeyId,
      paymentId: payment._id,
      breakdown: {
        amount,
        platformCommission,
        workerAmount,
        commissionRate: rate,
      },
      worker: {
        id: application.worker._id,
        name: application.worker.name,
      },
      job: {
        id: job._id,
        title: job.title,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verifies Razorpay payment signature after customer completes checkout.
 * POST /api/v1/payments/verify
 */
export const verifyPaymentHandler = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || typeof razorpayOrderId !== 'string') {
      throw new AppError('razorpayOrderId is required', 400);
    }
    if (!razorpayPaymentId || typeof razorpayPaymentId !== 'string') {
      throw new AppError('razorpayPaymentId is required', 400);
    }
    if (!razorpaySignature || typeof razorpaySignature !== 'string') {
      throw new AppError('razorpaySignature is required', 400);
    }

    // 1. Locate the payment record by razorpayOrderId
    const payment = await Payment.findOne({ razorpayOrderId: razorpayOrderId.trim() });
    if (!payment) {
      throw new AppError('Payment record not found for this order', 404);
    }

    // 2. Customer ownership verification
    if (String(payment.customer) !== String(req.user._id)) {
      throw new AppError('Unauthorized: You do not have permission to verify this payment', 403);
    }

    // 3. Idempotency check: if already verified, return successful response without duplicate modifications
    if (payment.status === 'paid') {
      // Ensure applications are cleaned up
      await Application.deleteMany({ job: payment.job });

      await payment.populate([
        { path: 'worker', select: 'name phone email' },
        { path: 'job', select: 'title salary location' },
        { path: 'customer', select: 'name phone email' },
      ]);

      return res.status(200).json({
        success: true,
        message: 'Payment was already verified successfully',
        payment,
      });
    }

    // 4. Cryptographically verify signature with secret
    const isValid = verifyRazorpaySignature({
      razorpayOrderId: razorpayOrderId.trim(),
      razorpayPaymentId: razorpayPaymentId.trim(),
      razorpaySignature: razorpaySignature.trim(),
    });

    if (!isValid) {
      payment.status = 'failed';
      await payment.save();
      throw new AppError('Invalid payment signature verification failed', 400);
    }

    // 4b. Determine payment method from verified Razorpay payment details rather than trusting frontend input
    let verifiedMethod = payment.paymentMethod || 'upi';
    try {
      const paymentDetails = await fetchRazorpayPayment(razorpayPaymentId.trim());
      if (paymentDetails) {
        // Cross-verify order ID match
        if (paymentDetails.order_id && paymentDetails.order_id !== razorpayOrderId.trim()) {
          throw new AppError('Payment order ID mismatch with gateway record', 400);
        }
        if (paymentDetails.method) {
          const methodStr = String(paymentDetails.method).toLowerCase();
          if (['upi', 'card', 'netbanking', 'wallet'].includes(methodStr)) {
            verifiedMethod = methodStr;
          } else {
            verifiedMethod = 'other';
          }
        }
      }
    } catch (fetchErr) {
      if (fetchErr instanceof AppError) throw fetchErr;
      console.warn('[Payment Gateway Fetch Notice]:', fetchErr?.message || fetchErr);
    }

    // 5. Update payment record to paid with authentic verified details
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpayPaymentId.trim();
    payment.razorpaySignature = razorpaySignature.trim();
    payment.paymentMethod = verifiedMethod;
    payment.paidAt = new Date();
    await payment.save();

    // 5b. Update associated Job workflow status to paid and closed, preserving worker
    await Job.findByIdAndUpdate(payment.job, {
      workflowStatus: 'paid',
      status: 'closed',
      paidAt: payment.paidAt,
      worker: payment.worker,
    });

    // 5c. Automatically delete the application(s) after completion of work and payment
    await Application.deleteMany({ job: payment.job });

    await payment.populate([
      { path: 'worker', select: 'name phone email' },
      { path: 'job', select: 'title salary location' },
      { path: 'customer', select: 'name phone email' },
    ]);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns payments for the authenticated user (customer or worker).
 * GET /api/v1/payments/my-payments
 */
export const getMyPaymentsHandler = async (req, res, next) => {
  try {
    const isCustomer = req.user.role === 'customer';
    const filter = isCustomer ? { customer: req.user._id } : { worker: req.user._id };

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .populate('worker', 'name phone email')
      .populate('customer', 'name phone email')
      .populate('job', 'title location salary status')
      .exec();

    let summary = {};

    if (isCustomer) {
      const totalPaid = payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const pendingCount = payments.filter((p) => p.status === 'pending').length;
      const paidCount = payments.filter((p) => p.status === 'paid').length;

      summary = {
        totalPaid: Math.round(totalPaid * 100) / 100,
        pendingCount,
        paidCount,
      };
    } else {
      // Worker summary
      const totalEarnings = payments
        .filter((p) => p.status === 'paid')
        .reduce((sum, p) => sum + (p.workerAmount || 0), 0);

      const pendingPayments = payments
        .filter((p) => p.status === 'pending')
        .reduce((sum, p) => sum + (p.workerAmount || 0), 0);

      const completedCount = payments.filter((p) => p.status === 'paid').length;

      summary = {
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        pendingPayments: Math.round(pendingPayments * 100) / 100,
        completedPayments: Math.round(totalEarnings * 100) / 100,
        completedCount,
      };
    }

    res.status(200).json({
      success: true,
      payments,
      summary,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns payment record for a specific job.
 * GET /api/v1/payments/job/:jobId
 */
export const getJobPaymentHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) {
      throw new AppError('Invalid job ID', 400);
    }

    const payment = await Payment.findOne({ job: jobId })
      .sort({ createdAt: -1 })
      .populate('worker', 'name phone email')
      .populate('customer', 'name phone email')
      .populate('job', 'title salary location status')
      .exec();

    if (!payment) {
      return res.status(200).json({
        success: true,
        payment: null,
      });
    }

    // Authorization: customer who paid, worker who is assigned, or admin
    const isCustomer = String(payment.customer._id || payment.customer) === String(req.user._id);
    const isWorker = String(payment.worker._id || payment.worker) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      throw new AppError('You do not have permission to view this payment', 403);
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Returns payment detail by payment ID.
 * GET /api/v1/payments/:paymentId
 */
export const getPaymentDetailHandler = async (req, res, next) => {
  try {
    const { paymentId } = req.params;

    if (!isValidId(paymentId)) {
      throw new AppError('Invalid payment ID', 400);
    }

    const payment = await Payment.findById(paymentId)
      .populate('worker', 'name phone email')
      .populate('customer', 'name phone email')
      .populate('job', 'title salary location status')
      .exec();

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    const isCustomer = String(payment.customer._id || payment.customer) === String(req.user._id);
    const isWorker = String(payment.worker._id || payment.worker) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      throw new AppError('You do not have permission to view this payment', 403);
    }

    res.status(200).json({
      success: true,
      payment,
    });
  } catch (err) {
    next(err);
  }
};
