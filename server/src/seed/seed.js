import { connectDB } from '../config/db.js';
import { requireEnv } from '../config/env.js';
import Admin from '../models/Admin.js';

async function run() {
  requireEnv('JWT_SECRET');

  const email = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'Bilaladmin@egim.ma';
  const password = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  const overwrite = process.env.OVERWRITE_ADMIN === 'true';

  if (!password) {
    throw new Error('ADMIN_PASSWORD or SEED_ADMIN_PASSWORD is required');
  }

  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail });

  if (admin && !overwrite) {
    console.log(`Admin already exists: ${normalizedEmail}`);
    console.log('Set OVERWRITE_ADMIN=true to update this account.');
    process.exit(0);
  }

  if (admin) {
    admin.name = 'EGIM Admin';
    admin.password = password;
    admin.role = 'admin';
    await admin.save();
    console.log(`Admin updated: ${normalizedEmail}`);
    process.exit(0);
  }

  await Admin.create({
    name: 'EGIM Admin',
    email: normalizedEmail,
    password,
    role: 'admin'
  });

  console.log(`Admin created: ${normalizedEmail}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
