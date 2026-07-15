import Admin from '../models/Admin.js';
import { connectDB, getDatabaseStatus } from '../config/db.js';
import { getEnv } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

function logLoginStep(req, step, details = {}) {
  console.info('Login request', {
    step,
    method: req.method,
    path: req.originalUrl,
    database: getDatabaseStatus(),
    ...details
  });
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  logLoginStep(req, 'received', {
    hasEmail: typeof email === 'string' && email.trim().length > 0,
    hasPassword: typeof password === 'string' && password.length > 0
  });

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  await connectDB();
  logLoginStep(req, 'database-connected');

  const normalizedEmail = email.trim().toLowerCase();
  const admin = await Admin.findOne({ email: normalizedEmail });
  logLoginStep(req, 'admin-lookup-complete', { adminFound: Boolean(admin) });

  if (!admin?.password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    logLoginStep(req, 'password-check-failed', { adminFound: true });
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  if (!getEnv('JWT_SECRET')) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  const user = { id: admin._id, name: admin.name, email: admin.email, role: admin.role };
  logLoginStep(req, 'success', { adminFound: true });

  return res.json({
    success: true,
    token: signToken(admin),
    user,
    admin: user
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.admin, admin: req.admin });
});
