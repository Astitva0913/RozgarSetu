import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

const isValidId = (id) => mongoose.isValidObjectId(id);

/**
 * Worker starts work on an accepted job.
 * POST /api/v1/jobs/:jobId/start
 */
export const startWorkHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) {
      throw new AppError('Invalid job ID', 400);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // 1. Confirm the job has an accepted application
    const application = await Application.findOne({ job: jobId, status: 'accepted' });
    if (!application) {
      throw new AppError('Job does not have an accepted worker application.', 400);
    }

    // 2. Validate that the requesting worker is assigned to this job
    if (String(application.worker) !== String(req.user._id)) {
      throw new AppError('You are not authorized to start work on this job.', 403);
    }

    // 3. Workflow state validation
    if (job.workflowStatus === 'in_progress') {
      throw new AppError('Work is already in progress for this job.', 400);
    }

    if (['completed', 'customer_confirmed', 'paid'].includes(job.workflowStatus)) {
      throw new AppError('Cannot start an already completed or paid job.', 400);
    }

    // 4. Update workflow state to IN_PROGRESS
    job.workflowStatus = 'in_progress';
    job.workStartedAt = new Date();
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Work started successfully.',
      job: {
        id: job._id,
        title: job.title,
        status: job.status,
        workflowStatus: job.workflowStatus,
        workStartedAt: job.workStartedAt,
        workCompletedAt: job.workCompletedAt,
        customerConfirmedAt: job.customerConfirmedAt,
        paidAt: job.paidAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Worker finishes work on an in-progress job.
 * POST /api/v1/jobs/:jobId/finish
 */
export const finishWorkHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) {
      throw new AppError('Invalid job ID', 400);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // 1. Confirm the job has an accepted application
    const application = await Application.findOne({ job: jobId, status: 'accepted' });
    if (!application) {
      throw new AppError('Job does not have an accepted worker application.', 400);
    }

    // 2. Validate requesting worker authorization
    if (String(application.worker) !== String(req.user._id)) {
      throw new AppError('You are not authorized to finish work on this job.', 403);
    }

    // 3. Workflow state validation: must be IN_PROGRESS
    if (job.workflowStatus === 'worker_accepted' || job.workflowStatus === 'open') {
      throw new AppError('Cannot finish work before starting it.', 400);
    }

    if (job.workflowStatus === 'completed') {
      throw new AppError('Work has already been marked as completed.', 400);
    }

    if (['customer_confirmed', 'paid'].includes(job.workflowStatus)) {
      throw new AppError('Work has already been completed and confirmed.', 400);
    }

    if (job.workflowStatus !== 'in_progress') {
      throw new AppError('Job must be in progress to mark it completed.', 400);
    }

    // 4. Update workflow state to COMPLETED
    job.workflowStatus = 'completed';
    job.workCompletedAt = new Date();
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Work completed successfully. Waiting for customer confirmation and payment.',
      job: {
        id: job._id,
        title: job.title,
        status: job.status,
        workflowStatus: job.workflowStatus,
        workStartedAt: job.workStartedAt,
        workCompletedAt: job.workCompletedAt,
        customerConfirmedAt: job.customerConfirmedAt,
        paidAt: job.paidAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Customer confirms satisfactory completion of work.
 * POST /api/v1/jobs/:jobId/confirm-completion
 */
export const confirmCompletionHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) {
      throw new AppError('Invalid job ID', 400);
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // 1. Validate customer ownership
    if (String(job.customer) !== String(req.user._id)) {
      throw new AppError('You are not authorized to confirm this job.', 403);
    }

    // 2. Workflow state validation: must be COMPLETED
    if (['open', 'worker_accepted', 'in_progress'].includes(job.workflowStatus)) {
      throw new AppError('Cannot confirm completion before worker has finished the work.', 400);
    }

    if (job.workflowStatus === 'customer_confirmed') {
      throw new AppError('Work completion has already been confirmed.', 400);
    }

    if (job.workflowStatus === 'paid') {
      throw new AppError('Job has already been paid for.', 400);
    }

    if (job.workflowStatus !== 'completed') {
      throw new AppError('Work must be marked as completed by the worker before confirmation.', 400);
    }

    // 3. Update workflow state to CUSTOMER_CONFIRMED
    job.workflowStatus = 'customer_confirmed';
    job.customerConfirmedAt = new Date();
    await job.save();

    res.status(200).json({
      success: true,
      message: 'Work completion confirmed successfully. Payment is now ready.',
      job: {
        id: job._id,
        title: job.title,
        status: job.status,
        workflowStatus: job.workflowStatus,
        workStartedAt: job.workStartedAt,
        workCompletedAt: job.workCompletedAt,
        customerConfirmedAt: job.customerConfirmedAt,
        paidAt: job.paidAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get workflow status of a job.
 * GET /api/v1/jobs/:jobId/workflow
 */
export const getWorkflowStatusHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) {
      throw new AppError('Invalid job ID', 400);
    }

    const job = await Job.findById(jobId).populate('customer', 'name phone email');
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    const application = await Application.findOne({ job: jobId, status: 'accepted' })
      .populate('worker', 'name phone email skills location');

    let worker = application?.worker || null;

    // Fallback if application was auto-deleted after completion of work and payment
    if (!worker) {
      const Payment = mongoose.model('Payment');
      const paymentDoc = await Payment.findOne({ job: jobId }).populate('worker', 'name phone email skills location');
      if (paymentDoc?.worker) {
        worker = paymentDoc.worker;
      } else if (job.worker) {
        const User = mongoose.model('User');
        worker = await User.findById(job.worker).select('name phone email skills location');
      }
    }

    // Access authorization: customer owner, accepted worker, or admin
    const isCustomer = String(job.customer?._id || job.customer) === String(req.user._id);
    const isWorker = worker && String(worker._id || worker) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isCustomer && !isWorker && !isAdmin) {
      throw new AppError('You are not authorized to view this workflow.', 403);
    }

    res.status(200).json({
      success: true,
      workflow: {
        jobId: job._id,
        title: job.title,
        salary: job.salary,
        status: job.status,
        workflowStatus: job.workflowStatus || (job.status === 'open' ? 'open' : 'worker_accepted'),
        workStartedAt: job.workStartedAt,
        workCompletedAt: job.workCompletedAt,
        customerConfirmedAt: job.customerConfirmedAt,
        paidAt: job.paidAt,
        worker: worker || null,
        customer: job.customer || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
