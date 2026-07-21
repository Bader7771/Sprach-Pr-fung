import mongoose from 'mongoose';

const examLabels = {
  exam1: 'Lesen',
  exam2: 'Hören',
  exam3: 'Schreiben',
  exam4: 'Sprechen'
};

const studentSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    fullName: { type: String, trim: true },
    studentNumber: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date },
    examLevel: { type: String, enum: ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'], default: '' },
    comments: { type: String, trim: true, default: '' },
    classRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoom', required: true },
    className: { type: String, required: true, trim: true },
    notes: [
      {
        subject: { type: String, required: true, trim: true },
        grade: { type: Number, required: true, min: 0, max: 20 },
        comment: { type: String, trim: true, default: '' }
      }
    ],
    exams: {
      exam1: { type: Number, min: 0, max: 20 },
      exam2: { type: Number, min: 0, max: 20 },
      exam3: { type: Number, min: 0, max: 20 },
      exam4: { type: Number, min: 0, max: 20 }
    },
    examAbsences: {
      exam1: { type: Boolean, default: false },
      exam2: { type: Boolean, default: false },
      exam3: { type: Boolean, default: false },
      exam4: { type: Boolean, default: false }
    },
    finalNote: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  { timestamps: true }
);

studentSchema.index({ fullName: 'text', firstName: 'text', lastName: 'text', studentNumber: 'text', className: 'text' });
studentSchema.index({ classRoom: 1, lastName: 1, firstName: 1 });

function splitName(fullName = '') {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
}

function notesFromLegacyExams(exams = {}) {
  return ['exam1', 'exam2', 'exam3', 'exam4']
    .map((key) => ({ subject: examLabels[key], grade: exams[key] }))
    .filter((note) => Number.isFinite(note.grade));
}

studentSchema.pre('validate', function normalizeStudent(next) {
  if ((!this.firstName || !this.lastName) && this.fullName) {
    const names = splitName(this.fullName);
    if (!this.firstName) this.firstName = names.firstName;
    if (!this.lastName) this.lastName = names.lastName;
  }

  this.fullName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();

  if (!this.notes?.length && this.exams) {
    this.notes = notesFromLegacyExams(this.exams);
  }

  const examKeys = ['exam1', 'exam2', 'exam3', 'exam4'];
  const examGrades = examKeys
    .filter((key) => !this.examAbsences?.[key])
    .map((key) => Number(this.exams?.[key]))
    .filter((grade) => Number.isFinite(grade));
  const noteGrades = (this.notes || [])
    .map((note) => Number(note.grade))
    .filter((grade) => Number.isFinite(grade));
  const grades = examGrades.length ? examGrades : noteGrades;

  this.finalNote = grades.length
    ? Number((grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(2))
    : 0;

  next();
});

export default mongoose.model('Student', studentSchema);
