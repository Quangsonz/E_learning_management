/**
 * Seed / Upsert Demo Accounts Script
 * 
 * Accounts seeded:
 * 1. Admin:   admin@demo.com   / Admin@123456   (role: admin, isVerified: true, isActive: true)
 * 2. Teacher: teacher@demo.com / Teacher@123456 (role: teacher, isVerified: true, isActive: true)
 * 3. Student: student@demo.com / Student@123456 (role: student, isVerified: true, isActive: true)
 * 
 * Usage:
 *   node src/scripts/seedDemoAccounts.js
 *   npm run seed:demo
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const DEMO_ACCOUNTS = [
  {
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'Admin@123456',
    role: 'admin',
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Demo Teacher',
    email: 'teacher@demo.com',
    password: 'Teacher@123456',
    role: 'teacher',
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Demo Student',
    email: 'student@demo.com',
    password: 'Student@123456',
    role: 'student',
    isVerified: true,
    isActive: true,
  },
];

/**
 * Upserts demo accounts safely with password hashing
 * @returns {Promise<Array<{ email: string, role: string, status: string }>>}
 */
async function seedDemoAccounts() {
  const results = [];

  for (const acc of DEMO_ACCOUNTS) {
    let user = await User.findOne({ email: acc.email }).select('+password');

    if (user) {
      user.name = acc.name;
      user.role = acc.role;
      user.isVerified = acc.isVerified;
      user.isActive = acc.isActive;
      user.password = acc.password; // Triggers pre('save') bcrypt hashing
      await user.save();

      results.push({ email: acc.email, role: acc.role, status: 'UPDATED' });
      console.log(`[SEED] Updated demo account: ${acc.email} (${acc.role})`);
    } else {
      user = new User({
        name: acc.name,
        email: acc.email,
        password: acc.password, // Triggers pre('save') bcrypt hashing
        role: acc.role,
        isVerified: acc.isVerified,
        isActive: acc.isActive,
      });
      await user.save();

      results.push({ email: acc.email, role: acc.role, status: 'CREATED' });
      console.log(`[SEED] Created demo account: ${acc.email} (${acc.role})`);
    }
  }

  return results;
}

// Execute directly if run via CLI
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI;
  const dbName = process.env.DB_NAME || 'E-Learning';

  if (!mongoUri) {
    console.error('[SEED ERROR] MONGO_URI is not defined in environment variables.');
    process.exit(1);
  }

  (async () => {
    try {
      console.log(`[SEED] Connecting to MongoDB (DB: ${dbName})...`);
      await mongoose.connect(mongoUri, { dbName, serverSelectionTimeoutMS: 5000 });
      console.log('[SEED] Connected successfully. Seeding demo accounts...');

      const summary = await seedDemoAccounts();
      console.log('\n--- SEED SUMMARY ---');
      summary.forEach((item) => {
        console.log(`  - [${item.status}] ${item.email} (Role: ${item.role})`);
      });
      console.log('--------------------\n');

      await mongoose.disconnect();
      console.log('[SEED] MongoDB disconnected. Demo accounts ready for presentation/defense.');
      process.exit(0);
    } catch (err) {
      console.error('[SEED ERROR] Seeding failed:', err.message);
      try {
        await mongoose.disconnect();
      } catch (_) {}
      process.exit(1);
    }
  })();
}

module.exports = { seedDemoAccounts, DEMO_ACCOUNTS };
