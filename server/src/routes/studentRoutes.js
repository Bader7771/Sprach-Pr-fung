import express from 'express';
import multer from 'multer';
import {
  createStudent,
  deleteStudent,
  exportStudents,
  getStudent,
  importStudents,
  listStudents,
  updateStudent
} from '../controllers/studentController.js';
import { generateCertificate } from '../controllers/certificateController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/public', listStudents);
router.use(protect);
router.get('/export/excel', exportStudents);
router.post('/import/excel', upload.single('file'), importStudents);
router.route('/').get(listStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(deleteStudent);
router.get('/:id/certificate', generateCertificate);

export default router;
