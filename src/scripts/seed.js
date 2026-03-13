require('dotenv').config();

const bcrypt = require('bcryptjs');
const connectDb = require('../config/db');
const User = require('../models/User');

const defaultUsers = [
  {
    name: process.env.SEED_TEACHER_NAME || 'Teacher One',
    email: process.env.SEED_TEACHER_EMAIL || 'teacher@example.com',
    password: process.env.SEED_TEACHER_PASSWORD || 'Password123',
    role: 'teacher',
  },
  {
    name: process.env.SEED_STUDENT_NAME || 'Student One',
    email: process.env.SEED_STUDENT_EMAIL || 'student@example.com',
    password: process.env.SEED_STUDENT_PASSWORD || 'Password123',
    role: 'student',
  },
];

const run = async () => {
  await connectDb();

  for (const userData of defaultUsers) {
    const existing = await User.findOne({ email: userData.email.toLowerCase() });
    if (existing) {
      console.log(`User already exists: ${userData.email}`);
      continue;
    }

    const passwordHash = await bcrypt.hash(userData.password, 10);
    await User.create({
      name: userData.name,
      email: userData.email.toLowerCase(),
      passwordHash,
      role: userData.role,
    });

    console.log(`Created user: ${userData.email} (${userData.role})`);
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
