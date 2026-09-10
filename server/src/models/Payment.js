import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required'],
      index: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Worker reference is required'],
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job reference is required'],
      index: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: false,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be non-negative'],
      max: [10000, 'Payment amount cannot exceed the limit of ₹10,000'],
    },
    commissionRate: {
      type: Number,
      required: true,
      default: 0.10,
    },
    platformCommission: {
      type: Number,
      required: [true, 'Platform commission is required'],
      min: [0, 'Commission must be non-negative'],
    },
    workerAmount: {
      type: Number,
      required: [true, 'Worker amount is required'],
      min: [0, 'Worker amount must be non-negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      required: [true, 'Razorpay order ID is required'],
      unique: true,
      trim: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
      trim: true,
      sparse: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['upi', 'card', 'netbanking', 'wallet', 'other'],
      default: 'upi',
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for query performance
paymentSchema.index({ customer: 1, createdAt: -1 });
paymentSchema.index({ worker: 1, createdAt: -1 });
paymentSchema.index({ job: 1, status: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
