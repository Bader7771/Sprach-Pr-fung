import ClassRoom from '../models/ClassRoom.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const publicStudentSelect = 'firstName lastName fullName className studentNumber exams examAbsences finalNote';

export const listPublicClasses = asyncHandler(async (req, res) => {
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
        studentCount: { $size: '$students' }
      }
    },
    { $project: { students: 0 } }
  ]);

  res.json(classes);
});

export const getPublicClassResults = asyncHandler(async (req, res) => {
  const classRoom = await ClassRoom.findById(req.params.classId).select('className');
  if (!classRoom) return res.status(404).json({ message: 'Class not found' });

  const students = await Student.find({ classRoom: classRoom._id })
    .sort({ lastName: 1, firstName: 1, fullName: 1 })
    .select(publicStudentSelect);

  res.json({ classRoom, students });
});
