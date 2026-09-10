import AppError from '../utils/AppError.js';

export const getWorkerProfileHandler = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorkerProfileHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const updates = {};

    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
        throw new AppError('Name must be a non-empty string', 400);
      }
      updates.name = req.body.name.trim();
    }

    if (req.body.location !== undefined) {
      if (typeof req.body.location !== 'string' || req.body.location.trim().length === 0) {
        throw new AppError('Location must be a non-empty string', 400);
      }
      updates.location = req.body.location.trim();
    }

    if (req.body.skills !== undefined) {
      if (!Array.isArray(req.body.skills) || req.body.skills.some(s => typeof s !== 'string')) {
        throw new AppError('Skills must be an array of strings', 400);
      }
      updates.skills = req.body.skills.map(s => s.trim());
    }

    if (req.body.experience !== undefined) {
      const exp = Number(req.body.experience);
      if (isNaN(exp) || exp < 0) {
        throw new AppError('Experience must be a non-negative number', 400);
      }
      updates.experience = exp;
    }

    if (req.body.workType !== undefined) {
      if (typeof req.body.workType !== 'string') {
        throw new AppError('Work type must be a string', 400);
      }
      updates.workType = req.body.workType.trim();
    }

    if (req.body.availability !== undefined) {
      if (typeof req.body.availability !== 'string') {
        throw new AppError('Availability must be a string', 400);
      }
      updates.availability = req.body.availability.trim();
    }

    if (req.body.bio !== undefined) {
      if (typeof req.body.bio !== 'string') {
        throw new AppError('Bio must be a string', 400);
      }
      updates.bio = req.body.bio.trim();
    }

    Object.assign(user, updates);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Worker profile updated successfully',
      user: user.toPublicJSON(),
    });
  } catch (error) {
    next(error);
  }
};
