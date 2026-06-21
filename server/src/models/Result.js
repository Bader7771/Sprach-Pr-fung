import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true, unique: true },
    exams: {
      exam1: { type: Number, required: true },
      exam2: { type: Number, required: true },
      exam3: { type: Number, required: true },
      exam4: { type: Number, required: true }
    },
    finalNote: { type: Number, required: true }
  },
  { timestamps: true }
);

export default mongoose.model('Result', resultSchema);
