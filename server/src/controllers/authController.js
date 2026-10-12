import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { generateToken } from '../utils/token.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { ensureAdminSeed } from '../services/adminSeedService.js';

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    let user = await User.findOne({ email: cleanEmail });
    if (!user) {
      // If no admin user exists in DB, run safe idempotent auto-seed
      const count = await User.countDocuments({ role: 'admin' });
      if (count === 0) {
        await ensureAdminSeed();
        user = await User.findOne({ email: cleanEmail });
      }
    }

    if (!user) {
      return sendError(res, 'Invalid email or password credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password credentials', 401);
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return sendSuccess(
      res,
      {
        token,
        user: user.toSafeObject(),
      },
      'Admin logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res) => {
  return sendSuccess(res, req.user.toSafeObject(), 'Profile fetched successfully');
};

export const checkAdminExists = async (req, res, next) => {
  try {
    let count = await User.countDocuments({ role: 'admin' });
    if (count === 0) {
      await ensureAdminSeed();
      count = await User.countDocuments({ role: 'admin' });
    }
    return sendSuccess(res, { hasAdmin: count > 0 }, 'Admin status checked');
  } catch (error) {
    next(error);
  }
};

export const bootstrapAdmin = async (req, res, next) => {
  try {
    const count = await User.countDocuments();
    if (count > 0) {
      return sendError(res, 'An administrator account is already registered.', 403);
    }

    const { name, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: 'admin',
    });

    const token = generateToken(newAdmin);

    return sendSuccess(
      res,
      {
        token,
        user: newAdmin.toSafeObject(),
      },
      'Initial admin account initialized successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};
