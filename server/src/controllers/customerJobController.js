import mongoose from 'mongoose';
import AppError from '../utils/AppError.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import env from '../config/env.js';

const isValidId = (id) => mongoose.isValidObjectId(id);

const validateNonEmptyString = (val) => typeof val === 'string' && val.trim().length > 0;

export const createJobHandler = async (req, res, next) => {
  try {
    const { title, description, requiredSkills, location, salary, workType } = req.body;

    // Validate required fields
    if (!validateNonEmptyString(title)) {
      throw new AppError('title is required and must be a non-empty string', 400);
    }

    if (!validateNonEmptyString(description)) {
      throw new AppError('description is required and must be a non-empty string', 400);
    }

    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0 || !requiredSkills.every(s => typeof s === 'string')) {
      throw new AppError('requiredSkills must be a non-empty array of strings', 400);
    }

    if (!validateNonEmptyString(location)) {
      throw new AppError('location is required and must be a non-empty string', 400);
    }

    if (salary === undefined || salary === null || typeof salary !== 'number' || Number.isNaN(salary) || salary < 0) {
      throw new AppError('salary is required and must be a non-negative number', 400);
    }

    if (salary > env.paymentLimit) {
      throw new AppError(`Salary cannot exceed the payment limit of ₹${env.paymentLimit.toLocaleString('en-IN')}`, 400);
    }

    if (!validateNonEmptyString(workType)) {
      throw new AppError('workType is required and must be a non-empty string', 400);
    }

    const job = await Job.create({
      title: title.trim(),
      description: description.trim(),
      requiredSkills: requiredSkills.map(s => s.trim()).filter(Boolean),
      location: location.trim(),
      salary,
      workType: workType.trim(),
      customer: req.user._id,
    });

    res.status(201).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

export const getMyJobsHandler = async (req, res, next) => {
  try {
    const { status, page: pageQ, limit: limitQ } = req.query;

    const filter = { customer: req.user._id };

    if (status !== undefined) {
      const s = String(status).trim();
      if (!['open', 'closed'].includes(s)) {
        throw new AppError('Invalid status filter', 400);
      }
      filter.status = s;
    }

    const page = pageQ !== undefined ? parseInt(pageQ, 10) : 1;
    const limit = limitQ !== undefined ? parseInt(limitQ, 10) : 10;

    if (Number.isNaN(page) || page < 1) {
      throw new AppError('Invalid page parameter', 400);
    }

    if (Number.isNaN(limit) || limit < 1 || limit > 50) {
      throw new AppError('Invalid limit parameter', 400);
    }

    const total = await Job.countDocuments(filter);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const jobs = await Job.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    res.status(200).json({
      success: true,
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyJobHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      throw new AppError('Invalid job id', 400);
    }

    const job = await Job.findOne({ _id: id, customer: req.user._id });

    if (!job) {
      throw new AppError('Job not found', 404);
    }

    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

export const updateMyJobHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      throw new AppError('Invalid job id', 400);
    }

    const job = await Job.findOne({ _id: id, customer: req.user._id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Allowed fields
    const allowed = ['title', 'description', 'requiredSkills', 'location', 'salary', 'workType', 'status'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    // Validate updates
    if (updates.title !== undefined) {
      if (!validateNonEmptyString(updates.title)) throw new AppError('title must be a non-empty string', 400);
      job.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      if (!validateNonEmptyString(updates.description)) throw new AppError('description must be a non-empty string', 400);
      job.description = updates.description.trim();
    }

    if (updates.requiredSkills !== undefined) {
      if (!Array.isArray(updates.requiredSkills) || updates.requiredSkills.length === 0 || !updates.requiredSkills.every(s => typeof s === 'string')) {
        throw new AppError('requiredSkills must be a non-empty array of strings', 400);
      }
      job.requiredSkills = updates.requiredSkills.map(s => s.trim()).filter(Boolean);
    }

    if (updates.location !== undefined) {
      if (!validateNonEmptyString(updates.location)) throw new AppError('location must be a non-empty string', 400);
      job.location = updates.location.trim();
    }

    if (updates.salary !== undefined) {
      if (typeof updates.salary !== 'number' || Number.isNaN(updates.salary) || updates.salary < 0) throw new AppError('salary must be a non-negative number', 400);
      if (updates.salary > env.paymentLimit) throw new AppError(`Salary cannot exceed the payment limit of ₹${env.paymentLimit.toLocaleString('en-IN')}`, 400);
      job.salary = updates.salary;
    }

    if (updates.workType !== undefined) {
      if (!validateNonEmptyString(updates.workType)) throw new AppError('workType must be a non-empty string', 400);
      job.workType = updates.workType.trim();
    }

    if (updates.status !== undefined) {
      const s = String(updates.status).trim();
      if (!['open', 'closed'].includes(s)) throw new AppError('Invalid status value', 400);
      job.status = s;
    }

    await job.save();

    res.status(200).json({ success: true, job });
  } catch (error) {
    next(error);
  }
};

export const deleteMyJobHandler = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidId(id)) {
      throw new AppError('Invalid job id', 400);
    }

    const job = await Job.findOne({ _id: id, customer: req.user._id });
    if (!job) {
      throw new AppError('Job not found', 404);
    }

    // Check for existing applications referencing this job
    const appCount = await Application.countDocuments({ job: job._id });
    if (appCount > 0) {
      throw new AppError('Cannot delete a job that has applications.', 409);
    }

    await job.deleteOne();

    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    next(error);
  }
};
