import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary must be a non-negative number'],
      max: [10000, 'Salary cannot exceed the payment limit of ₹10,000'],
    },
    workType: {
      type: String,
      required: [true, 'Work type is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    workflowStatus: {
      type: String,
      enum: ['open', 'worker_accepted', 'in_progress', 'completed', 'customer_confirmed', 'paid'],
      default: 'open',
      index: true,
    },
    workStartedAt: {
      type: Date,
      default: null,
    },
    workCompletedAt: {
      type: Date,
      default: null,
    },
    customerConfirmedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
