import ClassRoom from '../models/ClassRoom.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analytics = asyncHandler(async (req, res) => {
  const [totalClasses, totalStudents, averageResult, recentStudents] = await Promise.all([
    ClassRoom.countDocuments(),
    Student.countDocuments(),
    Student.aggregate([{ $group: { _id: null, score: { $avg: '$finalNote' } } }]),
    Student.find().sort({ createdAt: -1 }).limit(5).select('firstName lastName fullName className finalNote createdAt studentNumber')
  ]);

  res.json({
    totalClasses,
    totalStudents,
    averageGrade: Number((averageResult[0]?.score || 0).toFixed(2)),
    recentStudents
  });
});
