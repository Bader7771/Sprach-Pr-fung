import express from 'express';
import { getPublicClassResults, listPublicClasses } from '../controllers/publicController.js';
import { requireDatabase } from '../config/db.js';

const router = express.Router();

router.use(requireDatabase);
router.get('/classes', listPublicClasses);
router.get('/classes/:classId/results', getPublicClassResults);

export default router;
