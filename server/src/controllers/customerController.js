import User from '../models/User.js';
import AppError from '../utils/AppError.js';

const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

export const searchWorkersHandler = async (req, res, next) => {
  try {
    const query = { role: 'worker' };

    // 1. Filter by skills (comma-separated, case-insensitive)
    if (req.query.skills) {
      const skillsList = req.query.skills.split(',').map(s => s.trim()).filter(Boolean);
      if (skillsList.length > 0) {
        query.skills = {
          $in: skillsList.map(skill => new RegExp(`^${escapeRegex(skill)}$`, 'i'))
        };
      }
    }

    // 2. Filter by location (case-insensitive, partial matching)
    if (req.query.location) {
      query.location = new RegExp(escapeRegex(req.query.location.trim()), 'i');
    }

    // 3. Filter by availability (case-insensitive, partial matching)
    if (req.query.availability) {
      query.availability = new RegExp(escapeRegex(req.query.availability.trim()), 'i');
    }

    // 4. Filter by workType (case-insensitive, partial matching)
    if (req.query.workType) {
      query.workType = new RegExp(escapeRegex(req.query.workType.trim()), 'i');
    }

    // 5. Filter by minExperience and maxExperience
    let min;
    let max;

    if (req.query.minExperience !== undefined) {
      min = Number(req.query.minExperience);
      if (Number.isNaN(min) || min < 0) {
        throw new AppError('minExperience must be a non-negative number', 400);
      }
      query.experience = { ...query.experience, $gte: min };
    }

    if (req.query.maxExperience !== undefined) {
      max = Number(req.query.maxExperience);
      if (Number.isNaN(max) || max < 0) {
        throw new AppError('maxExperience must be a non-negative number', 400);
      }
      query.experience = { ...query.experience, $lte: max };
    }

    if (min !== undefined && max !== undefined && min > max) {
      throw new AppError('minExperience must not be greater than maxExperience', 400);
    }

    // 6. Pagination (strict validation as required)
    let page;
    let limit;

    if (req.query.page !== undefined) {
      const p = Number(req.query.page);
      if (Number.isNaN(p) || !Number.isInteger(p) || p < 1) {
        throw new AppError('Invalid page parameter', 400);
      }
      page = p;
    } else {
      page = 1;
    }

    if (req.query.limit !== undefined) {
      const l = Number(req.query.limit);
      if (Number.isNaN(l) || !Number.isInteger(l) || l < 1 || l > 50) {
        throw new AppError('Invalid limit parameter', 400);
      }
      limit = l;
    } else {
      limit = 10;
    }

    const skip = (page - 1) * limit;

    // Execute queries
    const workers = await User.find(query).skip(skip).limit(limit);
    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      workers: workers.map(w => w.toPublicJSON()),
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
