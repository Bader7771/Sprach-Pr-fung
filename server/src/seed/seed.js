import { connectDB } from '../config/db.js';
import { validateEnv } from '../config/env.js';
import Admin from '../models/Admin.js';
import ClassRoom from '../models/ClassRoom.js';
import Result from '../models/Result.js';
import Student from '../models/Student.js';

async function run() {
  validateEnv();
  await connectDB();

  if (process.env.RESET_SEED_DATA === 'true') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESET_SEED_DATA cannot be used when NODE_ENV=production');
    }

    await Promise.all([Admin.deleteMany(), ClassRoom.deleteMany(), Student.deleteMany(), Result.deleteMany()]);
  }

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@school.com';
  let admin = await Admin.findOne({ email: seedAdminEmail });
  if (!admin) {
    if (!process.env.SEED_ADMIN_PASSWORD) {
      throw new Error('SEED_ADMIN_PASSWORD is required to create the seed admin');
    }

    admin = await Admin.create({
      name: 'School Admin',
      email: seedAdminEmail,
      password: process.env.SEED_ADMIN_PASSWORD,
      role: 'admin'
    });
  }

  const classSeeds = [
    { className: '1st Year', groupNumber: 'Group A' },
    { className: '1st Year', groupNumber: 'Group B' },
    { className: '2nd Year', groupNumber: 'Group A' }
  ];
  const classes = [];

  for (const item of classSeeds) {
    const classRoom = await ClassRoom.findOneAndUpdate(
      item,
      item,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    classes.push(classRoom);
  }

  const samples = [
    ['Amina Benali', classes[0], [14, 16, 12, 18]],
    ['Youssef Amrani', classes[0], [17, 15, 16, 19]],
    ['Sara Haddad', classes[1], [13, 14, 15, 16]],
    ['Omar El Fassi', classes[2], [18, 18, 17, 19]]
  ];

  for (const [fullName, classRoom, exams] of samples) {
    let student = await Student.findOne({ fullName, className: classRoom.className, groupNumber: classRoom.groupNumber });
    if (!student) {
      student = new Student({
        fullName,
        classRoom: classRoom._id,
        className: classRoom.className,
        groupNumber: classRoom.groupNumber,
        exams: { exam1: exams[0], exam2: exams[1], exam3: exams[2], exam4: exams[3] },
        createdBy: admin._id
      });
      await student.save();
    }
    await Result.findOneAndUpdate(
      { student: student._id },
      { student: student._id, exams: student.exams, finalNote: student.finalNote },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log('Seed complete');
  console.log(`Admin login email: ${seedAdminEmail}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
