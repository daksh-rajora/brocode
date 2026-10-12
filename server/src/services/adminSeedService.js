import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

/**
 * Idempotently verifies and seeds the initial administrator account
 * from environment variables (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME).
 *
 * Rules:
 * - If admin with configured email exists: preserves record and returns existing user.
 * - Never resets or modifies existing passwords.
 * - Never logs or exposes passwords.
 * - Safely handles email normalization (lowercase, trim).
 */
export const ensureAdminSeed = async () => {
  try {
    const adminEmail = (config.admin.email || '').toLowerCase().trim();
    const adminPassword = config.admin.password;
    const adminName = (config.admin.name || 'Admin').trim();

    if (!adminEmail || !adminPassword) {
      return null;
    }

    if (adminPassword.length < 6) {
      console.warn('[Admin Seed] ADMIN_PASSWORD must be at least 6 characters. Skipping auto-seed.');
      return null;
    }

    // 1. Check if admin with this exact email already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return existingAdmin;
    }

    // 2. Hash password with bcrypt salt factor 10
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    // 3. Create administrator record
    const newAdmin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'admin',
    });

    console.log(`[Admin Seed] Initial administrator account initialized: ${newAdmin.email}`);
    return newAdmin;
  } catch (error) {
    console.error(`[Admin Seed Error] Failed to verify/seed admin: ${error.message}`);
    return null;
  }
};
