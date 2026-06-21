import mongoose from 'mongoose';

const classRoomSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    groupNumber: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

classRoomSchema.index({ className: 1, groupNumber: 1 }, { unique: true });

export default mongoose.model('ClassRoom', classRoomSchema);
