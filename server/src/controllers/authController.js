import { connectDB } from '../config/db.js';
import { getMongoUri } from '../config/env.js';
import Admin from '../models/Admin.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    if (!getMongoUri()) {
      throw new Error('MONGO_URI is not configured');
    }

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail });

    if (!admin?.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await admin.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = signToken(admin);
    const user = { id: admin._id, name: admin.name, email: admin.email, role: admin.role };

    return res.json({
      success: true,
      token,
      user,
      admin: user
    });
  } catch (error) {
    next(error);
  }
}

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.admin, admin: req.admin });
});
