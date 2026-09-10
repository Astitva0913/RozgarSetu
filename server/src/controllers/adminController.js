import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Payment from '../models/Payment.js';

const isValidId = (id) => mongoose.isValidObjectId(id);

const SAFE_USER_FIELDS = 'name phone email role isVerified location skills experience workType availability createdAt updatedAt';

export const listUsersHandler = async (req, res, next) => {
  try {
    const { role, isVerified, search, page: pageQ, limit: limitQ } = req.query;

    let page = pageQ !== undefined ? parseInt(pageQ, 10) : 1;
    let limit = limitQ !== undefined ? parseInt(limitQ, 10) : 10;

    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = {};
    if (role) {
      const r = String(role).trim();
      if (!['worker', 'customer', 'admin'].includes(r)) throw new AppError('Invalid role filter', 400);
      filter.role = r;
    }

    if (isVerified !== undefined) {
      if (isVerified === 'true' || isVerified === 'false') {
        filter.isVerified = isVerified === 'true';
      } else {
        throw new AppError('Invalid isVerified filter', 400);
      }
    }

    if (search) {
      const s = String(search).trim();
      const regex = new RegExp(s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
      filter.$or = [ { name: regex }, { phone: regex }, { email: regex } ];
    }

    const total = await User.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const users = await User.find(filter)
      .select(SAFE_USER_FIELDS)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.status(200).json({ success: true, users, pagination: { page, limit, total, totalPages } });
  } catch (err) {
    next(err);
  }
};

export const getUserHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) throw new AppError('Invalid user id', 400);

    const user = await User.findById(userId).select(SAFE_USER_FIELDS);
    if (!user) throw new AppError('User not found', 404);

    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

export const listJobsHandler = async (req, res, next) => {
  try {
    const { status, location, workType, page: pageQ, limit: limitQ } = req.query;

    let page = pageQ !== undefined ? parseInt(pageQ, 10) : 1;
    let limit = limitQ !== undefined ? parseInt(limitQ, 10) : 10;
    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = {};
    if (status !== undefined) {
      const s = String(status).trim();
      if (!['open','closed'].includes(s)) throw new AppError('Invalid status filter', 400);
      filter.status = s;
    }

    if (location) filter.location = new RegExp(String(location).trim().replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
    if (workType) filter.workType = new RegExp(String(workType).trim().replace(/[-\\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');

    const total = await Job.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const jobs = await Job.find(filter)
      .select('title description location salary workType status customer createdAt updatedAt')
      .populate({ path: 'customer', select: 'name phone email' })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.status(200).json({ success: true, jobs, pagination: { page, limit, total, totalPages } });
  } catch (err) { next(err); }
};

export const getJobHandler = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    if (!isValidId(jobId)) throw new AppError('Invalid job id', 400);

    const job = await Job.findById(jobId).populate({ path: 'customer', select: 'name phone email' });
    if (!job) throw new AppError('Job not found', 404);

    const applicationCount = await Application.countDocuments({ job: jobId });

    const result = {
      id: job._id,
      title: job.title,
      description: job.description,
      location: job.location,
      salary: job.salary,
      workType: job.workType,
      status: job.status,
      customer: job.customer ? { id: job.customer._id, name: job.customer.name, phone: job.customer.phone, email: job.customer.email } : null,
      applicationCount,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };

    res.status(200).json({ success: true, job: result });
  } catch (err) { next(err); }
};

export const listApplicationsHandler = async (req, res, next) => {
  try {
    const { status, page: pageQ, limit: limitQ } = req.query;
    let page = pageQ !== undefined ? parseInt(pageQ, 10) : 1;
    let limit = limitQ !== undefined ? parseInt(limitQ, 10) : 10;
    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = {};
    if (status !== undefined) {
      const s = String(status).trim();
      if (!['pending','accepted','rejected'].includes(s)) throw new AppError('Invalid status filter', 400);
      filter.status = s;
    }

    const total = await Application.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'job', select: 'title location salary workType status customer', populate: { path: 'customer', select: 'name phone email' } })
      .populate({ path: 'worker', select: 'name phone email location skills experience workType availability bio' })
      .exec();

    const items = applications.map(a => ({
      id: a._id,
      status: a.status,
      createdAt: a.createdAt,
      job: a.job ? {
        id: a.job._id,
        title: a.job.title,
        location: a.job.location,
        salary: a.job.salary,
        workType: a.job.workType,
        status: a.job.status,
        customer: a.job.customer ? { id: a.job.customer._id, name: a.job.customer.name, phone: a.job.customer.phone, email: a.job.customer.email } : null,
      } : null,
      worker: a.worker ? {
        id: a.worker._id,
        name: a.worker.name,
        phone: a.worker.phone,
        email: a.worker.email || null,
        location: a.worker.location || '',
        skills: a.worker.skills || [],
        experience: a.worker.experience ?? 0,
        workType: a.worker.workType || '',
        availability: a.worker.availability || '',
        bio: a.worker.bio || '',
      } : null,
    }));

    res.status(200).json({ success: true, applications: items, pagination: { page, limit, total, totalPages } });
  } catch (err) { next(err); }
};

export const getStatsHandler = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const closedJobs = await Job.countDocuments({ status: 'closed' });

    const totalApplications = await Application.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: 'pending' });
    const acceptedApplications = await Application.countDocuments({ status: 'accepted' });
    const rejectedApplications = await Application.countDocuments({ status: 'rejected' });

    // Payment aggregations (paid only)
    const paymentAgg = await Payment.aggregate([
      { $match: { status: 'paid' } },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalTransactionValue: { $sum: '$amount' },
          totalPlatformCommission: { $sum: '$platformCommission' },
          totalWorkerEarnings: { $sum: '$workerAmount' },
        },
      },
    ]);

    const pStats = paymentAgg[0] || {
      totalPayments: 0,
      totalTransactionValue: 0,
      totalPlatformCommission: 0,
      totalWorkerEarnings: 0,
    };

    const stats = {
      totalUsers,
      totalWorkers,
      totalCustomers,
      totalJobs,
      openJobs,
      closedJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      totalPayments: pStats.totalPayments,
      totalTransactionValue: Math.round(pStats.totalTransactionValue * 100) / 100,
      totalPlatformCommission: Math.round(pStats.totalPlatformCommission * 100) / 100,
      totalWorkerEarnings: Math.round(pStats.totalWorkerEarnings * 100) / 100,
    };

    res.status(200).json({ success: true, stats });
  } catch (err) { next(err); }
};

export const listPaymentsHandler = async (req, res, next) => {
  try {
    const { status, page: pageQ, limit: limitQ } = req.query;
    let page = pageQ !== undefined ? parseInt(pageQ, 10) : 1;
    let limit = limitQ !== undefined ? parseInt(limitQ, 10) : 10;

    if (Number.isNaN(page) || page < 1) throw new AppError('Invalid page parameter', 400);
    if (Number.isNaN(limit) || limit < 1 || limit > 50) throw new AppError('Invalid limit parameter', 400);

    const filter = {};
    if (status) {
      const s = String(status).trim();
      if (!['pending', 'paid', 'failed', 'refunded'].includes(s)) {
        throw new AppError('Invalid payment status filter', 400);
      }
      filter.status = s;
    }

    const total = await Payment.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'customer', select: 'name phone email' })
      .populate({ path: 'worker', select: 'name phone email' })
      .populate({ path: 'job', select: 'title location salary' })
      .exec();

    res.status(200).json({
      success: true,
      payments,
      pagination: { page, limit, total, totalPages },
    });
  } catch (err) {
    next(err);
  }
};

