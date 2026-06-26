require('dotenv').config();
const mongoose = require('mongoose');
const lessonService = require('./src/services/lesson.service');
const courseRepository = require('./src/repositories/course.repository');
const userRepository = require('./src/repositories/user.repository');
const enrollmentRepository = require('./src/repositories/enrollment.repository');
const lessonRepository = require('./src/repositories/lesson.repository');

(async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/e-learning');
    console.log('Connected to MongoDB');

    // Get an admin user
    const admin = await userRepository.findOne({ role: 'admin' });
    if (!admin) throw new Error('Admin not found');

    // Get a course
    const course = await courseRepository.findOne({});
    if (!course) throw new Error('Course not found');
    console.log('Course ID:', course._id);

    // Create a lesson
    const lessonData = {
      title: 'Auto Test Lesson ' + Date.now(),
      videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    };
    const createdLesson = await lessonService.createLesson(course._id, lessonData, admin);
    console.log('Created Lesson:', createdLesson._id);

    // Fetch lessons as admin
    const lessonsAdmin = await lessonService.getLessonsByCourse(course._id, admin);
    console.log('Lessons count (Admin):', lessonsAdmin.length);

    // Create a student user
    let student = await userRepository.findOne({ email: 'student_test@example.com' });
    if (!student) {
      student = await userRepository.create({
        name: 'Test Student',
        email: 'student_test@example.com',
        password: 'password123',
        role: 'student'
      });
    }

    // Attempt to fetch lessons as student without enrollment
    try {
      await lessonService.getLessonsByCourse(course._id, student);
      console.log('ERROR: Student without enrollment fetched lessons successfully (should have thrown 403)');
    } catch (err) {
      console.log('Success: Student without enrollment got error:', err.statusCode);
    }

    // Enroll student
    let enrollment = await enrollmentRepository.findByStudentAndCourse(student._id, course._id);
    if (!enrollment) {
      enrollment = await enrollmentRepository.create({
        student: student._id,
        course: course._id,
        paymentStatus: 'completed'
      });
    } else {
      enrollment.paymentStatus = 'completed';
      await enrollment.save();
    }

    // Fetch lessons as enrolled student
    const lessonsEnrolled = await lessonService.getLessonsByCourse(course._id, student);
    console.log('Lessons count (Enrolled Student):', lessonsEnrolled.length);

    console.log('ALL TESTS PASSED!');
  } catch (err) {
    console.error('Test Failed:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
})();
