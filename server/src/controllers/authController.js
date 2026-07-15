import Admin from '../models/Admin.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { getMongoUri } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

function logAuthLogin(req, stage, details = {}) {
  console.log('[AUTH_LOGIN]', {
    requestId: req.requestId,
    stage,
    method: req.method,
    path: req.originalUrl,
    contentType: req.headers['content-type'],
    bodyExists: Boolean(req.body),
    receivedFields: Object.keys(req.body || {}),
    mongoReadyState: mongoose.connection.readyState,
    ...details
  });
}

function logAuthLoginError(req, error) {
  console.error('[AUTH_LOGIN_ERROR]', {
    requestId: req.requestId,
    name: error?.name,
    message: error?.message,
    code: error?.code,
    stack: error?.stack
  });
}

export async function login(req, res, next) {
  try {
    logAuthLogin(req, 'request_received');
    logAuthLogin(req, 'validation_started');

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

    logAuthLogin(req, 'database_connection_started');
    await connectDB();
    logAuthLogin(req, 'database_connection_ready');

    const normalizedEmail = email.trim().toLowerCase();
    logAuthLogin(req, 'user_lookup_started', { userCollection: Admin.collection.name });
    const admin = await Admin.findOne({ email: normalizedEmail });
    logAuthLogin(req, 'user_lookup_completed', {
      userFound: Boolean(admin),
      passwordRetrieved: Boolean(admin?.password),
      userCollection: Admin.collection.name
    });

    if (!admin?.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    logAuthLogin(req, 'password_check_started');
    const isPasswordValid = await admin.comparePassword(password);
    logAuthLogin(req, 'password_check_completed', { passwordValid: isPasswordValid });

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not configured');
    }

    logAuthLogin(req, 'jwt_generation_started');
    const token = signToken(admin);
    const user = { id: admin._id, name: admin.name, email: admin.email, role: admin.role };
    logAuthLogin(req, 'login_success', { userCollection: Admin.collection.name });

    return res.json({
      success: true,
      token,
      user,
      admin: user
    });
  } catch (error) {
    logAuthLoginError(req, error);
    next(error);
  }
}

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: req.admin, admin: req.admin });
});
