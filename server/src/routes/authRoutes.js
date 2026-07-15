import express from 'express';
import { login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { requireDatabase } from '../config/db.js';

const router = express.Router();

function validateLoginInput(req, res, next) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password must be strings' });
  }

  next();
}

router
  .route('/login')
  .post(validateLoginInput, requireDatabase, login)
  .all((req, res) => {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: 'Method not allowed. Use POST /api/auth/login.' });
  });
router.get('/me', requireDatabase, protect, me);

export default router;
