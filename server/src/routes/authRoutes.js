import express from 'express';
import { login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router
  .route('/login')
  .post(login)
  .all((req, res) => {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: 'Method not allowed. Use POST /api/auth/login.' });
  });
router.get('/me', protect, me);

export default router;
