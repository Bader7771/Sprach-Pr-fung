import jwt from 'jsonwebtoken';
import { requireEnv } from '../config/env.js';
import Admin from '../models/Admin.js';

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, requireEnv('JWT_SECRET'));
    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}
