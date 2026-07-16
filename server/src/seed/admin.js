import { connectDB } from '../config/db.js';
import { requireEnv } from '../config/env.js';
import Admin from '../models/Admin.js';

async function run() {
  requireEnv('JWT_SECRET');

  const email = process.env.ADMIN_EMAIL || process.env.SEED_ADMIN_EMAIL || 'Bilaladmin@egim.ma';
  const password = process.env.ADMIN_PASSWORD || process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'School Admin';
  const role = process.env.ADMIN_ROLE || 'admin';
  const overwrite = process.env.OVERWRITE_ADMIN === 'true';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
  }

  await connectDB();

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await Admin.findOne({ email: normalizedEmail });

  if (existing && !overwrite) {
    console.log(`Admin already exists: ${normalizedEmail}`);
    console.log('Set OVERWRITE_ADMIN=true to replace its password and profile fields.');
    process.exit(0);
  }

  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.password = password;
    await existing.save();
    console.log(`Admin updated: ${normalizedEmail}`);
    process.exit(0);
  }

  await Admin.create({
    name,
    email: normalizedEmail,
    password,
    role
  });

  console.log(`Admin created: ${normalizedEmail}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
