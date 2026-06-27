require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Enrollment = require('./src/models/Enrollment');

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');
  const res = await Enrollment.updateMany({ paymentStatus: 'pending' }, { paymentStatus: 'completed' });
  console.log('Updated enrollments:', res);
  await mongoose.disconnect();
}
fix();
