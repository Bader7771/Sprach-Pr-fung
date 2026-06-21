import ExcelJS from 'exceljs';
import { z } from 'zod';
import ClassRoom from '../models/ClassRoom.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../services/auditService.js';

const exam = z.coerce.number().min(0).max(20);
const studentSchema = z.object({
  fullName: z.string().min(2).trim(),
  classRoom: z.string().min(1),
  exam1: exam,
  exam2: exam,
  exam3: exam,
  exam4: exam
});

function studentPayload(data, classRoom, adminId) {
  return {
    fullName: data.fullName,
    classRoom: classRoom._id,
    className: classRoom.className,
    groupNumber: classRoom.groupNumber,
    exams: {
      exam1: data.exam1,
      exam2: data.exam2,
      exam3: data.exam3,
      exam4: data.exam4
    },
    updatedBy: adminId
  };
}

async function syncResult(student) {
  await Result.findOneAndUpdate(
    { student: student._id },
    { student: student._id, exams: student.exams, finalNote: student.finalNote },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

export const listStudents = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 100);
  const query = {};

  if (req.query.className) query.className = new RegExp(req.query.className, 'i');
  if (req.query.groupNumber) query.groupNumber = new RegExp(req.query.groupNumber, 'i');
  if (req.query.name) query.fullName = new RegExp(req.query.name, 'i');
  if (req.query.search) {
    const search = new RegExp(req.query.search, 'i');
    query.$or = [{ fullName: search }, { className: search }, { groupNumber: search }];
  }

  const [students, total] = await Promise.all([
    Student.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
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

  const student = new Student({ ...studentPayload(data, classRoom, req.admin._id), createdBy: req.admin._id });
  await student.save();
  await syncResult(student);
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
  await student.save();
  await syncResult(student);
  await writeAudit({ actor: req.admin._id, action: 'UPDATE', entity: 'Student', entityId: student._id.toString() });
  res.json(student);
});

export const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: 'Student not found' });
  await Result.deleteOne({ student: student._id });
  await writeAudit({ actor: req.admin._id, action: 'DELETE', entity: 'Student', entityId: req.params.id });
  res.json({ message: 'Student deleted' });
});

export const exportStudents = asyncHandler(async (req, res) => {
  const students = await Student.find().sort({ className: 1, groupNumber: 1, fullName: 1 });
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Students');
  sheet.columns = [
    { header: 'Full Name', key: 'fullName', width: 28 },
    { header: 'Class Name', key: 'className', width: 18 },
    { header: 'Group Number', key: 'groupNumber', width: 18 },
    { header: 'Exam 1', key: 'exam1', width: 10 },
    { header: 'Exam 2', key: 'exam2', width: 10 },
    { header: 'Exam 3', key: 'exam3', width: 10 },
    { header: 'Exam 4', key: 'exam4', width: 10 },
    { header: 'Final Note', key: 'finalNote', width: 12 }
  ];
  students.forEach((student) => sheet.addRow({
    fullName: student.fullName,
    className: student.className,
    groupNumber: student.groupNumber,
    exam1: student.exams.exam1,
    exam2: student.exams.exam2,
    exam3: student.exams.exam3,
    exam4: student.exams.exam4,
    finalNote: student.finalNote
  }));
  sheet.getRow(1).font = { bold: true };

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="students.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
});

export const importStudents = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Excel file is required' });

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(req.file.buffer);
  const sheet = workbook.worksheets[0];
  const created = [];
  const errors = [];

  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const raw = {
      fullName: row.getCell(1).text,
      className: row.getCell(2).text,
      groupNumber: row.getCell(3).text,
      exam1: row.getCell(4).value,
      exam2: row.getCell(5).value,
      exam3: row.getCell(6).value,
      exam4: row.getCell(7).value
    };

    try {
      const classRoom = await ClassRoom.findOneAndUpdate(
        { className: raw.className, groupNumber: raw.groupNumber },
        { className: raw.className, groupNumber: raw.groupNumber },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      const data = studentSchema.parse({ ...raw, classRoom: classRoom._id.toString() });
      const student = new Student({ ...studentPayload(data, classRoom, req.admin._id), createdBy: req.admin._id });
      await student.save();
      await syncResult(student);
      created.push(student);
    } catch (error) {
      errors.push({ row: rowNumber, message: error.message });
    }
  }

  await writeAudit({ actor: req.admin._id, action: 'IMPORT', entity: 'Student', metadata: { created: created.length, errors: errors.length } });
  res.status(201).json({ created: created.length, errors });
});
