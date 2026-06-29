import Admin from '../models/Admin.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

function logLoginError(error, req) {
  console.error('Login failed', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.originalUrl
  });
}

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password must be strings' });
    }

    const admin = await Admin.findOne({ email: email.trim().toLowerCase() });
    if (!admin?.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    return res.json({
      token: signToken(admin),
      admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    });
  } catch (error) {
    logLoginError(error, req);
    return res.status(500).json({ message: 'Login failed' });
  }
}

export const me = asyncHandler(async (req, res) => {
  res.json({ admin: req.admin });
});
