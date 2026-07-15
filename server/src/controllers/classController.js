import { z } from 'zod';
import ClassRoom from '../models/ClassRoom.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { writeAudit } from '../services/auditService.js';

const classSchema = z.object({
  className: z.string().min(1).trim()
});

function exactNameRegex(value) {
  return new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

export const listClasses = asyncHandler(async (req, res) => {
  const classes = await ClassRoom.aggregate([
    { $sort: { className: 1 } },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'classRoom',
        as: 'students'
      }
    },
    {
      $addFields: {
        studentCount: { $size: '$students' },
        averageGrade: {
          $round: [
            {
              $ifNull: [{ $avg: '$students.finalNote' }, 0]
            },
            2
          ]
        }
      }
    },
    { $project: { students: 0 } }
  ]);
  res.json(classes);
});

export const createClass = asyncHandler(async (req, res) => {
  const data = classSchema.parse(req.body);
  const existing = await ClassRoom.findOne({ className: exactNameRegex(data.className) });
  if (existing) return res.status(409).json({ message: 'Class already exists' });

  const classRoom = await ClassRoom.create(data);
  await writeAudit({ actor: req.admin._id, action: 'CREATE', entity: 'ClassRoom', entityId: classRoom._id.toString(), metadata: data });
  res.status(201).json(classRoom);
});

export const updateClass = asyncHandler(async (req, res) => {
  const data = classSchema.parse(req.body);
  const duplicate = await ClassRoom.findOne({
    _id: { $ne: req.params.id },
    className: exactNameRegex(data.className)
  });
  if (duplicate) return res.status(409).json({ message: 'Class already exists' });

  const classRoom = await ClassRoom.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
  if (!classRoom) return res.status(404).json({ message: 'Class not found' });

  await Student.updateMany(
    { classRoom: classRoom._id },
    { className: classRoom.className }
  );
  await writeAudit({ actor: req.admin._id, action: 'UPDATE', entity: 'ClassRoom', entityId: classRoom._id.toString(), metadata: data });
  res.json(classRoom);
});

export const deleteClass = asyncHandler(async (req, res) => {
  const count = await Student.countDocuments({ classRoom: req.params.id });
  if (count > 0) {
    return res.status(409).json({ message: 'Move or delete students before deleting this class' });
  }
  const classRoom = await ClassRoom.findByIdAndDelete(req.params.id);
  if (!classRoom) return res.status(404).json({ message: 'Class not found' });
  await writeAudit({ actor: req.admin._id, action: 'DELETE', entity: 'ClassRoom', entityId: req.params.id });
  res.json({ message: 'Class deleted' });
});
