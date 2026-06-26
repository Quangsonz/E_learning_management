const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./src/models/User');
  const emails = ['admin@test.com', 'teacher1@test.com', 'teacher2@test.com', 'student1@test.com', 'student2@test.com'];
  
  for (let email of emails) {
    const user = await User.findOne({ email });
    if (user) {
      user.password = 'password123';
      // Mongoose hook will hash it
      await user.save({ validateBeforeSave: false });
      console.log(`Fixed password for ${email}`);
    }
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
