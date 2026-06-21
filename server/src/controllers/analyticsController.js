import ClassRoom from '../models/ClassRoom.js';
import Student from '../models/Student.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const analytics = asyncHandler(async (req, res) => {
  const [totalClasses, totalStudents, bestStudent, averageResult, certificateResult, groups] = await Promise.all([
    ClassRoom.countDocuments(),
    Student.countDocuments(),
    Student.findOne().sort({ finalNote: -1, fullName: 1 }),
    Student.aggregate([{ $group: { _id: null, score: { $avg: '$finalNote' } } }]),
    Student.aggregate([{ $group: { _id: null, certificates: { $sum: '$certificatesGenerated' } } }]),
    ClassRoom.distinct('groupNumber')
  ]);

  res.json({
    totalClasses,
    totalGroups: groups.length,
    totalStudents,
    averageSchoolScore: Number((averageResult[0]?.score || 0).toFixed(2)),
    bestStudent,
    certificatesGenerated: certificateResult[0]?.certificates || 0
  });
});
