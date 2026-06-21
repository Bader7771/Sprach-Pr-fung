import express from 'express';
import { analytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, analytics);

export default router;
