import express from 'express';
import {
  addNote,
  createStudent,
  deleteNote,
  deleteStudent,
  getStudent,
  listStudents,
  updateNote,
  updateStudent
} from '../controllers/studentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.route('/').get(listStudents).post(createStudent);
router.route('/:id').get(getStudent).put(updateStudent).delete(deleteStudent);
router.post('/:id/notes', addNote);
router.put('/:id/notes/:noteId', updateNote);
router.delete('/:id/notes/:noteId', deleteNote);

export default router;
