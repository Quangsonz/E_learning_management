require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');

// Hardcode URI for safety if env fails, but prioritize env
const DB_URI = process.env.MONGO_URI || 'mongodb+srv://E-Learning-Project:cCdPVxaEdXFCk5og@e-learning-project.6mizwa8.mongodb.net/E-Learning?retryWrites=true&w=majority&appName=E-Learning-project';

const seedDatabase = async () => {
  try {
    console.log('Đang kết nối MongoDB...');
    await mongoose.connect(DB_URI);
    console.log('MongoDB đã kết nối thành công!');

    console.log('Đang xóa dữ liệu cũ (User, Category, Course, Lesson)...');
    await User.deleteMany();
    await Category.deleteMany();
    await Course.deleteMany();
    await Lesson.deleteMany();

    console.log('Đang tạo Users...');
    const admin = await User.create({
      name: 'Admin System',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    const teacher = await User.create({
      name: 'Teacher Evelyn',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher',
      isVerified: true
    });

    const student = await User.create({
      name: 'Student Demo',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      isVerified: true
    });

    console.log('Đang tạo Categories...');
    const designCategory = await Category.create({
      name: 'UI/UX Design',
      slug: 'ui-ux-design',
      description: 'Học thiết kế giao diện người dùng'
    });

    const webCategory = await Category.create({
      name: 'Web Development',
      slug: 'web-development',
      description: 'Lập trình web Frontend và Backend'
    });

    console.log('Đang tạo Courses...');
    const course1 = await Course.create({
      title: 'Product Design Masterclass',
      description: 'A premium learning experience inspired by the world\'s best platforms.',
      price: 49,
      instructor: teacher._id,
      category: designCategory._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800'
    });

    const course2 = await Course.create({
      title: 'React System Architecture',
      description: 'Học cách xây dựng hệ thống Frontend React mạnh mẽ và có thể mở rộng.',
      price: 69,
      instructor: teacher._id,
      category: webCategory._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'
    });

    console.log('Đang tạo Lessons...');
    // Course 1 lessons
    await Lesson.create([
      {
        course: course1._id,
        title: 'Course overview and success roadmap',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        duration: 1320, // 22 min
        order: 1
      },
      {
        course: course1._id,
        title: 'Core concepts and practical setup',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        duration: 4500, // 1h 15m
        order: 2
      }
    ]);

    // Course 2 lessons
    await Lesson.create([
      {
        course: course2._id,
        title: 'React Folder Structure',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        duration: 1200,
        order: 1
      },
      {
        course: course2._id,
        title: 'State Management with Redux',
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        duration: 2400,
        order: 2
      }
    ]);

    console.log('🎉 Đã seed dữ liệu thành công!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed data:', error);
    process.exit(1);
  }
};

seedDatabase();
