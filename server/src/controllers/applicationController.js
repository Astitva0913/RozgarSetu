import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';

const isValidId = (id) => mongoose.isValidObjectId(id);

// Worker: view open jobs
export const listOpenJobsHandler = async (req, res, next) => {
  try {
    const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 10;

    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = { status: 'open' };

    const total = await Job.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const jobs = await Job.find(filter)
      .select('title description location salary workType status createdAt updatedAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.status(200).json({ success: true, jobs, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    next(err);
  }
};

// Worker: get single job detail (safe for workers)
export const getJobDetailForWorkerHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!isValidId(jobId)) throw new AppError('Invalid job id', 400);

    const job = await Job.findById(jobId).exec();
    if (!job) throw new AppError('Job not found', 404);

    // Only allow access to jobs intended to be visible to workers.
    // Visible if job is open OR the requesting worker has an application for it.
    let hasApplication = false;
    let myApplicationStatus = null;

    if (job.status === 'open') {
      // visible
    } else {
      // closed job: only visible if the worker has an application
      const existing = await Application.findOne({ job: jobId, worker: req.user._id }).select('status').exec();
      if (!existing) {
        throw new AppError('Job not found', 404);
      }
      hasApplication = true;
      myApplicationStatus = existing.status;
    }

    // Determine if worker has applied (for open jobs too)
    if (!hasApplication) {
      const existing = await Application.findOne({ job: jobId, worker: req.user._id }).select('status').exec();
      if (existing) {
        hasApplication = true;
        myApplicationStatus = existing.status;
      }
    }

    // Build safe response
    const result = {
      id: job._id,
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills || [],
      location: job.location,
      salary: job.salary,
      workType: job.workType,
      status: job.status,
      workflowStatus: job.workflowStatus || (job.status === 'open' ? 'open' : 'worker_accepted'),
      workStartedAt: job.workStartedAt || null,
      workCompletedAt: job.workCompletedAt || null,
      customerConfirmedAt: job.customerConfirmedAt || null,
      paidAt: job.paidAt || null,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      hasApplied: Boolean(hasApplication),
    };

    if (hasApplication && myApplicationStatus) {
      result.myApplicationStatus = myApplicationStatus;
    }

    res.status(200).json({ success: true, job: result });
  } catch (err) {
    next(err);
  }
};

// Worker: apply to job
export const applyToJobHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    if (!isValidId(jobId)) throw new AppError('Invalid job id', 400);

    const job = await Job.findById(jobId);
    if (!job) throw new AppError('Job not found', 404);

    if (String(job.customer) === String(req.user._id)) {
      throw new AppError('Cannot apply to your own job', 400);
    }

    if (job.status !== 'open') {
      throw new AppError('Cannot apply to a closed job', 400);
    }

    // Check duplicate
    const existing = await Application.findOne({ job: jobId, worker: req.user._id });
    if (existing) {
      throw new AppError('You have already applied to this job', 400);
    }

    const application = await Application.create({ job: jobId, worker: req.user._id });

    res.status(201).json({ success: true, application });
  } catch (err) {
    // Handle unique index duplicate errors gracefully
    if (err.code === 11000) {
      return next(new AppError('You have already applied to this job', 400));
    }
    next(err);
  }
};

// Worker: list own applications
export const listMyApplicationsHandler = async (req, res, next) => {
  try {
    const { status } = req.query;
    const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 10;

    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = { worker: req.user._id };
    if (status !== undefined) {
      const s = String(status).trim();
      if (!['pending', 'accepted', 'rejected'].includes(s)) throw new AppError('Invalid status filter', 400);
      filter.status = s;
    }

    const total = await Application.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'job', select: 'title description location salary workType status' })
      .exec();

    // Map to safe shape
    const items = applications.map((a) => ({
      id: a._id,
      status: a.status,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      job: a.job ? {
        id: a.job._id,
        title: a.job.title,
        description: a.job.description,
        location: a.job.location,
        salary: a.job.salary,
        workType: a.job.workType,
        status: a.job.status,
      } : null,
    }));

    res.status(200).json({ success: true, applications: items, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    next(err);
  }
};

// Worker: withdraw application
export const withdrawApplicationHandler = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    if (!isValidId(applicationId)) throw new AppError('Invalid application id', 400);

    const appDoc = await Application.findOne({ _id: applicationId, worker: req.user._id });
    if (!appDoc) throw new AppError('Application not found', 404);

    if (appDoc.status !== 'pending') throw new AppError('Only pending applications can be withdrawn', 400);

    await appDoc.deleteOne();

    res.status(200).json({ success: true, message: 'Application withdrawn successfully' });
  } catch (err) {
    next(err);
  }
};

// Customer: list applications for a job
export const listApplicationsForJobHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!isValidId(jobId)) throw new AppError('Invalid job id', 400);

    const job = await Job.findOne({ _id: jobId, customer: req.user._id });
    if (!job) throw new AppError('Job not found', 404);

    const { status } = req.query;
    const page = req.query.page !== undefined ? parseInt(req.query.page, 10) : 1;
    const limit = req.query.limit !== undefined ? parseInt(req.query.limit, 10) : 10;

    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = { job: jobId };
    if (status !== undefined) {
      const s = String(status).trim();
      if (!['pending', 'accepted', 'rejected'].includes(s)) throw new AppError('Invalid status filter', 400);
      filter.status = s;
    }

    const total = await Application.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'worker', select: 'name phone location skills experience workType availability bio' })
      .exec();

    const items = applications.map((a) => ({
      id: a._id,
      status: a.status,
      createdAt: a.createdAt,
      jobId: jobId,
      worker: a.worker ? {
        id: a.worker._id,
        name: a.worker.name,
        phone: a.worker.phone,
        location: a.worker.location || '',
        skills: a.worker.skills || [],
        experience: a.worker.experience ?? 0,
        workType: a.worker.workType || '',
        availability: a.worker.availability || '',
        bio: a.worker.bio || '',
      } : null,
    }));

    res.status(200).json({ success: true, applications: items, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    next(err);
  }
};

// Customer: get single application for a job
export const getApplicationForJobHandler = async (req, res, next) => {
  try {
    const { jobId, applicationId } = req.params;
    if (!isValidId(jobId) || !isValidId(applicationId)) throw new AppError('Invalid id', 400);

    const job = await Job.findOne({ _id: jobId, customer: req.user._id });
    if (!job) throw new AppError('Job not found', 404);

    const application = await Application.findOne({ _id: applicationId, job: jobId })
      .populate({ path: 'worker', select: 'name phone location skills experience workType availability bio' })
      .exec();

    if (!application) throw new AppError('Application not found', 404);

    const result = {
      id: application._id,
      status: application.status,
      createdAt: application.createdAt,
      jobId: jobId,
      worker: application.worker ? {
        id: application.worker._id,
        name: application.worker.name,
        phone: application.worker.phone,
        location: application.worker.location || '',
        skills: application.worker.skills || [],
        experience: application.worker.experience ?? 0,
        workType: application.worker.workType || '',
        availability: application.worker.availability || '',
        bio: application.worker.bio || '',
      } : null,
    };

    res.status(200).json({ success: true, application: result });
  } catch (err) {
    next(err);
  }
};

// Customer: accept an application (and close job + reject other pending applications)
export const acceptApplicationHandler = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    const { jobId, applicationId } = req.params;
    if (!isValidId(jobId) || !isValidId(applicationId)) throw new AppError('Invalid id', 400);

    // Ensure job belongs to customer
    const job = await Job.findOne({ _id: jobId, customer: req.user._id }).session(session);
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    if (job.status === 'closed') {
      throw new AppError('Job is already closed', 400);
    }

    // Ensure application belongs to job
    const application = await Application.findOne({ _id: applicationId, job: jobId }).session(session);
    if (!application) {
      throw new AppError('Application not found', 404);
    }

    if (application.status !== 'pending') {
      throw new AppError('Only pending applications can be accepted', 400);
    }

    // Transactional update: prefer transactions but provide a safe fallback for standalone servers
    let usedTransaction = false;
    try {
      session.startTransaction();

      application.status = 'accepted';
      await application.save({ session });

      job.status = 'closed';
      job.workflowStatus = 'worker_accepted';
      job.worker = application.worker;
      await job.save({ session });

      await Application.updateMany(
        { job: jobId, status: 'pending', _id: { $ne: applicationId } },
        { $set: { status: 'rejected' } },
        { session }
      );

      await session.commitTransaction();
      usedTransaction = true;

      // Populate worker data for response
      await application.populate({ path: 'worker', select: 'name phone location skills experience workType availability bio' });

      const result = {
        id: application._id,
        status: application.status,
        jobId: jobId,
        worker: application.worker ? {
          id: application.worker._id,
          name: application.worker.name,
          phone: application.worker.phone,
          location: application.worker.location || '',
          skills: application.worker.skills || [],
          experience: application.worker.experience ?? 0,
          workType: application.worker.workType || '',
          availability: application.worker.availability || '',
          bio: application.worker.bio || '',
        } : null,
      };

      return res.status(200).json({ success: true, message: 'Application accepted successfully', application: result });
    } catch (txErr) {
      // If transaction failed due to unsupported deployment (standalone), fallback to best-effort non-transactional updates
      try { await session.abortTransaction(); } catch (e) { /* ignore */ }

      // Fallback: perform conditional updates without session
      // Accept the application only if it is still pending
      const acceptedApp = await Application.findOneAndUpdate(
        { _id: applicationId, job: jobId, status: 'pending' },
        { $set: { status: 'accepted' } },
        { returnDocument: 'after' }
      ).populate({ path: 'worker', select: 'name phone location skills experience workType availability bio' });

      if (!acceptedApp) {
        // If not accepted (maybe already accepted/rejected), return error
        throw new AppError('Only pending applications can be accepted', 400);
      }

      // Close the job only if it is still open
      await Job.findOneAndUpdate(
        { _id: jobId, status: 'open' },
        { $set: { status: 'closed', workflowStatus: 'worker_accepted', worker: acceptedApp.worker?._id || acceptedApp.worker } }
      ).exec();

      // Reject other pending applications
      await Application.updateMany({ job: jobId, status: 'pending', _id: { $ne: applicationId } }, { $set: { status: 'rejected' } }).exec();

      const result = {
        id: acceptedApp._id,
        status: acceptedApp.status,
        jobId: jobId,
        worker: acceptedApp.worker ? {
          id: acceptedApp.worker._id,
          name: acceptedApp.worker.name,
          phone: acceptedApp.worker.phone,
          location: acceptedApp.worker.location || '',
          skills: acceptedApp.worker.skills || [],
          experience: acceptedApp.worker.experience ?? 0,
          workType: acceptedApp.worker.workType || '',
          availability: acceptedApp.worker.availability || '',
          bio: acceptedApp.worker.bio || '',
        } : null,
      };

      return res.status(200).json({ success: true, message: 'Application accepted successfully', application: result });
    } finally {
      session.endSession();
    }
  } catch (err) {
    try { await session.abortTransaction(); } catch (e) { /* ignore */ }
    next(err);
  } finally {
    session.endSession();
  }
};

// Customer: reject an application (without closing job)
export const rejectApplicationHandler = async (req, res, next) => {
  try {
    const { jobId, applicationId } = req.params;
    if (!isValidId(jobId) || !isValidId(applicationId)) throw new AppError('Invalid id', 400);

    const job = await Job.findOne({ _id: jobId, customer: req.user._id });
    if (!job) throw new AppError('Job not found', 404);

    const application = await Application.findOne({ _id: applicationId, job: jobId });
    if (!application) throw new AppError('Application not found', 404);

    if (application.status !== 'pending') throw new AppError('Only pending applications can be rejected', 400);

    application.status = 'rejected';
    await application.save();

    res.status(200).json({ success: true, message: 'Application rejected successfully', application: { id: application._id, status: application.status, jobId } });
  } catch (err) {
    next(err);
  }
};

// Worker: get connection info for an accepted application
export const getConnectionForWorkerHandler = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    if (!isValidId(applicationId)) throw new AppError('Invalid application id', 400);

    const application = await Application.findOne({ _id: applicationId, worker: req.user._id })
      .populate({
        path: 'job',
        select: 'title description location salary workType status customer',
        populate: { path: 'customer', select: 'name phone location email' },
      })
      .exec();

    if (!application) throw new AppError('Application not found', 404);

    if (application.status !== 'accepted') {
      throw new AppError('Application is not accepted', 400);
    }

    const job = application.job;
    if (!job) throw new AppError('Job not found', 404);

    const customer = job.customer;

    const result = {
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        workType: job.workType,
        status: job.status,
      },
      customer: customer
        ? {
            id: customer._id,
            name: customer.name,
            phone: customer.phone,
            location: customer.location || '',
            email: customer.email || '',
          }
        : null,
    };

    res.status(200).json({ success: true, connection: result });
  } catch (err) {
    next(err);
  }
};

// Customer: get accepted worker for a job
export const getAcceptedWorkerForJobHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!isValidId(jobId)) throw new AppError('Invalid job id', 400);

    const job = await Job.findOne({ _id: jobId, customer: req.user._id });
    if (!job) throw new AppError('Job not found', 404);

    let application = await Application.findOne({ job: jobId, status: 'accepted' })
      .populate({ path: 'worker', select: 'name phone location skills experience workType availability bio' })
      .exec();

    let worker = application?.worker;

    // Fallback: If application was auto-deleted after work completion and payment
    if (!worker) {
      const Payment = mongoose.model('Payment');
      const payment = await Payment.findOne({ job: jobId }).populate({
        path: 'worker',
        select: 'name phone location skills experience workType availability bio',
      });
      if (payment?.worker) {
        worker = payment.worker;
      } else if (job.worker) {
        const User = mongoose.model('User');
        worker = await User.findById(job.worker).select('name phone location skills experience workType availability bio');
      }
    }

    if (!worker) throw new AppError('No accepted worker found', 404);

    const result = {
      job: {
        id: job._id,
        title: job.title,
        description: job.description,
        location: job.location,
        salary: job.salary,
        workType: job.workType,
        status: job.status,
        workflowStatus: job.workflowStatus || (job.status === 'open' ? 'open' : 'worker_accepted'),
        workStartedAt: job.workStartedAt || null,
        workCompletedAt: job.workCompletedAt || null,
        customerConfirmedAt: job.customerConfirmedAt || null,
        paidAt: job.paidAt || null,
      },
      worker: worker
        ? {
            id: worker._id,
            name: worker.name,
            phone: worker.phone,
            location: worker.location || '',
            skills: worker.skills || [],
            experience: worker.experience ?? 0,
            workType: worker.workType || '',
            availability: worker.availability || '',
            bio: worker.bio || '',
          }
        : null,
    };

    res.status(200).json({ success: true, acceptedWorker: result });
  } catch (err) {
    next(err);
  }
};
