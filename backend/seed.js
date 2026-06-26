require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');
const Enrollment = require('./src/models/Enrollment');
const Quiz = require('./src/models/Quiz');
const Question = require('./src/models/Question');
const Result = require('./src/models/Result');
const Review = require('./src/models/Review');
const Notification = require('./src/models/Notification');
const Certificate = require('./src/models/Certificate');
const Progress = require('./src/models/Progress');

const DB_URI = process.env.MONGO_URI || 'mongodb+srv://E-Learning-Project:cCdPVxaEdXFCk5og@e-learning-project.6mizwa8.mongodb.net/E-Learning?retryWrites=true&w=majority&appName=E-Learning-project';

const seedDatabase = async () => {
  try {
    console.log('Đang kết nối MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('MongoDB đã kết nối thành công!');

    console.log('Đang xóa dữ liệu cũ...');
    await Promise.all([
      User.deleteMany(), Category.deleteMany(), Course.deleteMany(), Lesson.deleteMany(),
      Enrollment.deleteMany(), Quiz.deleteMany(), Question.deleteMany(), Result.deleteMany(),
      Review.deleteMany(), Notification.deleteMany(), Certificate.deleteMany(), Progress.deleteMany()
    ]);

    console.log('Đang tạo Users...');
    const users = await User.create([
      { name: 'Admin', email: 'admin@test.com', password: 'password123', role: 'admin' },
      { name: 'Teacher 1', email: 'teacher1@test.com', password: 'password123', role: 'teacher' },
      { name: 'Teacher 2', email: 'teacher2@test.com', password: 'password123', role: 'teacher' },
      { name: 'Student 1', email: 'student1@test.com', password: 'password123', role: 'student' },
      { name: 'Student 2', email: 'student2@test.com', password: 'password123', role: 'student' }
    ]);
    const teachers = users.filter(u => u.role === 'teacher');
    const students = users.filter(u => u.role === 'student');

    console.log('Đang tạo Categories...');
    const categories = await Category.insertMany([
      { name: 'Web Development', slug: 'web-development' },
      { name: 'UI/UX Design', slug: 'ui-ux-design' },
      { name: 'Data Science', slug: 'data-science' },
      { name: 'Mobile App', slug: 'mobile-app' },
      { name: 'Marketing', slug: 'marketing' }
    ]);

    console.log('Đang tạo Courses...');
    const courses = await Course.insertMany([
      { title: 'React Masterclass', description: 'Học ReactJS từ cơ bản đến nâng cao', price: 49, instructor: teachers[0]._id, category: categories[0]._id, status: 'published' },
      { title: 'Figma for Beginners', description: 'Làm chủ Figma trong 30 ngày', price: 29, instructor: teachers[1]._id, category: categories[1]._id, status: 'published' },
      { title: 'Python for Data Science', description: 'Data Science cơ bản với Python', price: 59, instructor: teachers[0]._id, category: categories[2]._id, status: 'published' },
      { title: 'Flutter App Dev', description: 'Tạo ứng dụng di động với Flutter', price: 39, instructor: teachers[1]._id, category: categories[3]._id, status: 'published' },
      { title: 'Digital Marketing 101', description: 'Tiếp thị số cơ bản', price: 19, instructor: teachers[0]._id, category: categories[4]._id, status: 'published' }
    ]);

    console.log('Đang tạo Lessons...');
    const lessons = await Lesson.insertMany(courses.map((course, index) => ({
      course: course._id,
      title: `Lesson 1 for ${course.title}`,
      videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      duration: 1200 + index * 100,
      order: 1
    })));

    console.log('Đang tạo Enrollments...');
    const enrollments = await Enrollment.insertMany([
      { student: students[0]._id, course: courses[0]._id, paymentStatus: 'completed' },
      { student: students[0]._id, course: courses[1]._id, paymentStatus: 'completed' },
      { student: students[0]._id, course: courses[2]._id, paymentStatus: 'completed' },
      { student: students[1]._id, course: courses[0]._id, paymentStatus: 'completed' },
      { student: students[1]._id, course: courses[3]._id, paymentStatus: 'completed' }
    ]);

    console.log('Đang tạo Quizzes...');
    const quizzes = await Quiz.insertMany(courses.map(course => ({
      course: course._id,
      title: `Final Quiz for ${course.title}`,
      passingScore: 80,
      timeLimit: 30
    })));

    console.log('Đang tạo Questions...');
    const questions = await Question.insertMany(quizzes.map(quiz => ({
      quiz: quiz._id,
      text: `Question 1 for ${quiz.title}?`,
      options: [{ text: 'Option A', isCorrect: true }, { text: 'Option B', isCorrect: false }],
      explanation: 'Giải thích cho câu hỏi 1'
    })));

    console.log('Đang tạo Results...');
    const results = await Result.insertMany([
      { student: students[0]._id, quiz: quizzes[0]._id, score: 10, scorePercentage: 100, isPassed: true },
      { student: students[0]._id, quiz: quizzes[1]._id, score: 8, scorePercentage: 80, isPassed: true },
      { student: students[0]._id, quiz: quizzes[2]._id, score: 5, scorePercentage: 50, isPassed: false },
      { student: students[1]._id, quiz: quizzes[0]._id, score: 9, scorePercentage: 90, isPassed: true },
      { student: students[1]._id, quiz: quizzes[3]._id, score: 7, scorePercentage: 70, isPassed: false }
    ]);

    console.log('Đang tạo Reviews...');
    const reviews = await Review.insertMany([
      { student: students[0]._id, course: courses[0]._id, rating: 5, comment: 'Great course!' },
      { student: students[0]._id, course: courses[1]._id, rating: 4, comment: 'Good for beginners.' },
      { student: students[0]._id, course: courses[2]._id, rating: 3, comment: 'A bit fast paced.' },
      { student: students[1]._id, course: courses[0]._id, rating: 5, comment: 'Loved it.' },
      { student: students[1]._id, course: courses[3]._id, rating: 4, comment: 'Solid introduction.' }
    ]);

    console.log('Đang tạo Notifications...');
    const notifications = await Notification.insertMany([
      { recipient: students[0]._id, title: 'Welcome!', message: 'Welcome to E-Learning', type: 'system' },
      { recipient: students[0]._id, title: 'Course Started', message: 'You started React', type: 'course' },
      { recipient: students[1]._id, title: 'Welcome!', message: 'Welcome to E-Learning', type: 'system' },
      { recipient: teachers[0]._id, title: 'New Review', message: 'You got a 5 star review', type: 'system' },
      { recipient: teachers[1]._id, title: 'New Course', message: 'Your course is live', type: 'system' }
    ]);

    console.log('Đang tạo Certificates...');
    const certificates = await Certificate.insertMany([
      { student: students[0]._id, course: courses[0]._id, certificateId: 'CERT-001' },
      { student: students[0]._id, course: courses[1]._id, certificateId: 'CERT-002' },
      { student: students[1]._id, course: courses[0]._id, certificateId: 'CERT-003' },
      { student: students[1]._id, course: courses[3]._id, certificateId: 'CERT-004' },
      { student: students[0]._id, course: courses[2]._id, certificateId: 'CERT-005' }
    ]);

    console.log('Đang tạo Progresses...');
    const progresses = await Progress.insertMany([
      { student: students[0]._id, course: courses[0]._id, progressPercentage: 100, isCompleted: true },
      { student: students[0]._id, course: courses[1]._id, progressPercentage: 50, isCompleted: false },
      { student: students[0]._id, course: courses[2]._id, progressPercentage: 10, isCompleted: false },
      { student: students[1]._id, course: courses[0]._id, progressPercentage: 100, isCompleted: true },
      { student: students[1]._id, course: courses[3]._id, progressPercentage: 30, isCompleted: false }
    ]);

    console.log('🎉 Đã seed dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed data:', error);
    process.exit(1);
  }
};

seedDatabase();
