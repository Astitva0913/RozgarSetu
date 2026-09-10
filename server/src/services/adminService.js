import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import env from '../config/env.js';

export const seedAdminUser = async () => {
  if (!env.adminEmail || !env.adminPassword) {
    console.warn('[RozgaarSetu] Admin seed skipped: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    return;
  }

  const normalizedEmail = env.adminEmail.trim().toLowerCase();
  const existingAdmin = await User.findOne({ email: normalizedEmail, role: 'admin' }).select('+password');

  const hashedPassword = await bcrypt.hash(env.adminPassword, 10);

  if (existingAdmin) {
    existingAdmin.password = hashedPassword;
    existingAdmin.isVerified = true;
    await existingAdmin.save();
    console.log(`[RozgaarSetu] Admin credentials synchronized for ${normalizedEmail}`);
    return;
  }

  await User.create({
    name: 'Admin',
    email: normalizedEmail,
    password: hashedPassword,
    role: 'admin',
    isVerified: true,
  });

  console.log(`[RozgaarSetu] Admin user seeded for ${normalizedEmail}`);
};
