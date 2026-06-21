import { z } from 'zod';
import Admin from '../models/Admin.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { signToken } from '../utils/token.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const login = asyncHandler(async (req, res) => {
  const data = loginSchema.parse(req.body);
  const admin = await Admin.findOne({ email: data.email });
  if (!admin || !(await admin.comparePassword(data.password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({
    token: signToken(admin),
    admin: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ admin: req.admin });
});
