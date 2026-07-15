import { z } from 'zod';
import ClassRoom from '../models/ClassRoom.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../services/auditService.js';

const objectId = z.string().min(1);
const noteSchema = z.object({
  subject: z.string().min(1).trim(),
  grade: z.coerce.number().min(0).max(20),
  comment: z.string().trim().optional().default('')
});

const studentSchema = z.object({
  firstName: z.string().min(1).trim(),
  lastName: z.string().min(1).trim(),
  studentNumber: z.string().trim().optional().default(''),
  comments: z.string().trim().optional().default(''),
  classRoom: objectId,
  notes: z.array(noteSchema).optional()
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function studentPayload(data, classRoom, adminId) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    studentNumber: data.studentNumber,
    comments: data.comments,
    classRoom: classRoom._id,
    className: classRoom.className,
    updatedBy: adminId
  };
}

export const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 200);
  const query = {};

  if (req.query.classId) query.classRoom = req.query.classId;
  if (req.query.className) query.className = new RegExp(escapeRegex(String(req.query.className)), 'i');
  if (req.query.search) {
    const search = new RegExp(escapeRegex(String(req.query.search)), 'i');
    query.$or = [
      { firstName: search },
      { lastName: search },
      { fullName: search },
      { studentNumber: search }
    ];
  }

  const sort = req.query.sort === 'createdAt'
    ? { createdAt: -1 }
    : { lastName: 1, firstName: 1, fullName: 1 };

  const [students, total] = await Promise.all([
    Student.find(query).sort(sort).skip((page - 1) * limit).limit(limit),
    Student.countDocuments(query)
  ]);

  res.json({ data: students, page, limit, total, pages: Math.ceil(total / limit) || 1 });
});

export const getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  res.json(student);
});

export const createStudent = asyncHandler(async (req, res) => {
  const data = studentSchema.parse(req.body);
  const classRoom = await ClassRoom.findById(data.classRoom);
  if (!classRoom) return res.status(404).json({ message: 'Class not found' });

  const student = new Student({
    ...studentPayload(data, classRoom, req.admin._id),
    notes: data.notes || [],
    createdBy: req.admin._id
  });
  await student.save();
  await writeAudit({ actor: req.admin._id, action: 'CREATE', entity: 'Student', entityId: student._id.toString() });
  res.status(201).json(student);
});

export const updateStudent = asyncHandler(async (req, res) => {
  const data = studentSchema.parse(req.body);
  const [student, classRoom] = await Promise.all([
    Student.findById(req.params.id),
    ClassRoom.findById(data.classRoom)
  ]);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  if (!classRoom) return res.status(404).json({ message: 'Class not found' });

  Object.assign(student, studentPayload(data, classRoom, req.admin._id));
  if (data.notes) student.notes = data.notes;
  await student.save();
  await writeAudit({ actor: req.admin._id, action: 'UPDATE', entity: 'Student', entityId: student._id.toString() });
  res.json(student);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  await writeAudit({ actor: req.admin._id, action: 'DELETE', entity: 'Student', entityId: req.params.id });
  res.json({ message: 'Student deleted' });
});

export const addNote = asyncHandler(async (req, res) => {
  const data = noteSchema.parse(req.body);
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  student.notes.push(data);
  student.updatedBy = req.admin._id;
  await student.save();
  await writeAudit({ actor: req.admin._id, action: 'ADD_NOTE', entity: 'Student', entityId: student._id.toString() });
  res.status(201).json(student);
});

export const updateNote = asyncHandler(async (req, res) => {
  const data = noteSchema.parse(req.body);
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const note = student.notes.id(req.params.noteId);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  Object.assign(note, data);
  student.updatedBy = req.admin._id;
  await student.save();
  await writeAudit({ actor: req.admin._id, action: 'UPDATE_NOTE', entity: 'Student', entityId: student._id.toString() });
  res.json(student);
});

export const deleteNote = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });

  const note = student.notes.id(req.params.noteId);
  if (!note) return res.status(404).json({ message: 'Note not found' });

  note.deleteOne();
  student.updatedBy = req.admin._id;
  await student.save();
  await writeAudit({ actor: req.admin._id, action: 'DELETE_NOTE', entity: 'Student', entityId: student._id.toString() });
  res.json(student);
});
