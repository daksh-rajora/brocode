import { connectDB, closeDB } from '../config/db.js';
import { ensureAdminSeed } from '../services/adminSeedService.js';

const seedAdmin = async () => {
  try {
    await connectDB();
    const result = await ensureAdminSeed();
    if (result) {
      console.log(`[Seed Admin] Admin account ready: ${result.email}`);
    } else {
      console.log('[Seed Admin] No action performed or invalid configuration.');
    }
    await closeDB();
  } catch (error) {
    console.error(`[Seed Admin Failed]: ${error.message}`);
    await closeDB();
    process.exit(1);
  }
};

seedAdmin();
