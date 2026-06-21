import dotenv from 'dotenv';
import { connectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import ClassRoom from '../models/ClassRoom.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';

dotenv.config();

async function run() {
  await connectDB();
  await Promise.all([Admin.deleteMany(), ClassRoom.deleteMany(), Student.deleteMany(), Result.deleteMany()]);

  const admin = await Admin.create({
    name: 'School Admin',
    email: 'admin@school.com',
    password: 'Admin12345',
    role: 'admin'
  });

  const classes = await ClassRoom.insertMany([
    { className: '1st Year', groupNumber: 'Group A' },
    { className: '1st Year', groupNumber: 'Group B' },
    { className: '2nd Year', groupNumber: 'Group A' }
  ]);

  const samples = [
    ['Amina Benali', classes[0], [14, 16, 12, 18]],
    ['Youssef Amrani', classes[0], [17, 15, 16, 19]],
    ['Sara Haddad', classes[1], [13, 14, 15, 16]],
    ['Omar El Fassi', classes[2], [18, 18, 17, 19]]
  ];

  for (const [fullName, classRoom, exams] of samples) {
    const student = new Student({
      fullName,
      classRoom: classRoom._id,
      className: classRoom.className,
      groupNumber: classRoom.groupNumber,
      exams: { exam1: exams[0], exam2: exams[1], exam3: exams[2], exam4: exams[3] },
      createdBy: admin._id
    });
    await student.save();
    await Result.create({ student: student._id, exams: student.exams, finalNote: student.finalNote });
  }

  console.log('Seed complete');
  console.log('Admin login: admin@school.com / Admin12345');
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
