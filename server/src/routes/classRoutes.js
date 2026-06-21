import express from 'express';
import { createClass, deleteClass, listClasses, updateClass } from '../controllers/classController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(listClasses).post(createClass);
router.route('/:id').put(updateClass).delete(deleteClass);

export default router;
