import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { validateEnv } from '../config/env.js';

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function notesFromExams(exams = {}) {
  return ['exam1', 'exam2', 'exam3', 'exam4']
    .map((key, index) => ({ subject: `Note ${index + 1}`, grade: exams[key] }))
    .filter((note) => Number.isFinite(Number(note.grade)))
    .map((note) => ({ ...note, grade: Number(note.grade), comment: '' }));
}

async function run() {
  validateEnv();
  await connectDB();

  const students = mongoose.connection.db.collection('students');
  const classrooms = mongoose.connection.db.collection('classrooms');

  const cursor = students.find({});
  let studentsUpdated = 0;

  for await (const student of cursor) {
    const $set = {};
    const $unset = {};

    if ((!student.firstName || !student.lastName) && student.fullName) {
      const names = splitName(student.fullName);
      if (!student.firstName) $set.firstName = names.firstName;
      if (!student.lastName) $set.lastName = names.lastName;
    }

    if ((!student.notes || student.notes.length === 0) && student.exams) {
      const notes = notesFromExams(student.exams);
      $set.notes = notes;
      $set.finalNote = notes.length
        ? Number((notes.reduce((sum, note) => sum + note.grade, 0) / notes.length).toFixed(2))
        : 0;
    }

    if (Object.prototype.hasOwnProperty.call(student, 'groupNumber')) $unset.groupNumber = '';
    if (Object.prototype.hasOwnProperty.call(student, 'certificatesGenerated')) $unset.certificatesGenerated = '';

    if (Object.keys($set).length || Object.keys($unset).length) {
      const update = {};
      if (Object.keys($set).length) update.$set = $set;
      if (Object.keys($unset).length) update.$unset = $unset;
      await students.updateOne({ _id: student._id }, update);
      studentsUpdated += 1;
    }
  }

  const classResult = await classrooms.updateMany(
    { groupNumber: { $exists: true } },
    { $unset: { groupNumber: '' } }
  );

  console.log(`EGIM migration complete. Students updated: ${studentsUpdated}. Classes updated: ${classResult.modifiedCount}.`);
  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error(error.message);
  if (mongoose.connection.readyState !== 0) await mongoose.connection.close();
  process.exit(1);
});
