import bcrypt from 'bcryptjs';
import { connectDB, closeDB } from '../config/db.js';
import { User } from '../models/User.js';
import { config } from '../config/env.js';

const seedAdmin = async () => {
  try {
    await connectDB();

    const existingAdmin = await User.findOne({ email: config.admin.email.toLowerCase() });
    if (existingAdmin) {
      console.log(`[Seed Admin] Admin with email "${config.admin.email}" already exists.`);
      await closeDB();
      return;
    }

    if (!config.admin.password || config.admin.password.length < 6) {
      console.error('[Seed Admin Error] ADMIN_PASSWORD environment variable must be set with at least 6 characters.');
      await closeDB();
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(config.admin.password, salt);

    const admin = await User.create({
      name: config.admin.name || 'Hostel Admin',
      email: config.admin.email.toLowerCase(),
      passwordHash,
      role: 'admin',
    });

    console.log(`[Seed Admin Success] Created admin: ${admin.name} (${admin.email})`);
    await closeDB();
  } catch (error) {
    console.error(`[Seed Admin Failed]: ${error.message}`);
    await closeDB();
    process.exit(1);
  }
};

seedAdmin();
