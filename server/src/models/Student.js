import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    classRoom: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoom', required: true },
    className: { type: String, required: true, trim: true },
    groupNumber: { type: String, required: true, trim: true },
    exams: {
      exam1: { type: Number, required: true, min: 0, max: 20 },
      exam2: { type: Number, required: true, min: 0, max: 20 },
      exam3: { type: Number, required: true, min: 0, max: 20 },
      exam4: { type: Number, required: true, min: 0, max: 20 }
    },
    finalNote: { type: Number, default: 0 },
    certificatesGenerated: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' }
  },
  { timestamps: true }
);

studentSchema.index({ fullName: 'text', className: 'text', groupNumber: 'text' });
studentSchema.index({ className: 1, groupNumber: 1, fullName: 1 });

studentSchema.pre('save', function calculateFinal(next) {
  const { exam1, exam2, exam3, exam4 } = this.exams;
  this.finalNote = Number(((exam1 + exam2 + exam3 + exam4) / 4).toFixed(2));
  next();
});

export default mongoose.model('Student', studentSchema);
