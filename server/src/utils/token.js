import jwt from 'jsonwebtoken';
import { env, requireEnv } from '../config/env.js';

export function signToken(admin) {
  return jwt.sign(
    { id: admin._id, email: admin.email, role: admin.role },
    requireEnv('JWT_SECRET'),
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}
