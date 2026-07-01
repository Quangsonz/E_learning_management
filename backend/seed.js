require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');
const Quiz = require('./src/models/Quiz');
const Enrollment = require('./src/models/Enrollment');
const Progress = require('./src/models/Progress');
const Review = require('./src/models/Review');
const Notification = require('./src/models/Notification');

async function seed() {
  try {
    // Kết nối Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Xóa toàn bộ dữ liệu cũ
    console.log('🗑️ Clearing old data...');
    await Promise.all([
      User.deleteMany(),
      Category.deleteMany(),
      Course.deleteMany(),
      Lesson.deleteMany(),
      Quiz.deleteMany(),
      Enrollment.deleteMany(),
      Progress.deleteMany(),
      Review.deleteMany(),
      Notification.deleteMany()
    ]);

    // 2. Tạo Users (Mật khẩu chung: password123)
    console.log('🌱 Seeding Users...');
    const admin = await User.create({
      name: 'System Admin',
      email: 'admin@elearning.com',
      password: 'password123',
      role: 'admin',
      avatar: 'https://i.pravatar.cc/150?u=admin',
      isVerified: true
    });

    const teacherA = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@elearning.com',
      password: 'password123',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80',
      isVerified: true
    });

    const teacherB = await User.create({
      name: 'Michael Chen',
      email: 'michael@elearning.com',
      password: 'password123',
      role: 'teacher',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&q=80',
      isVerified: true
    });

    // Hardcore Learner
    const student1 = await User.create({
      name: 'Alex Developer',
      email: 'alex@student.com',
      password: 'password123',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=500&q=80',
      isVerified: true,
      xp: 15400,
      level: 12,
      studyStreakDays: 14,
      totalFocusMinutes: 1850,
      badges: [
        { name: 'Fast Learner', icon: 'zap', description: 'Hoàn thành khóa học kỷ lục', awardedAt: new Date() },
        { name: 'Perfect Score', icon: 'star', description: '100% điểm bài Quiz', awardedAt: new Date() }
      ]
    });

    // Casual Learner
    const student2 = await User.create({
      name: 'Emma Design',
      email: 'emma@student.com',
      password: 'password123',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&q=80',
      isVerified: true,
      xp: 2500,
      level: 4,
      studyStreakDays: 3,
      totalFocusMinutes: 320
    });

    // Inactive Learner
    const student3 = await User.create({
      name: 'David Inactive',
      email: 'david@student.com',
      password: 'password123',
      role: 'student',
      avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=500&q=80',
      isVerified: true
    });

    // 3. Tạo Categories
    console.log('🌱 Seeding Categories...');
    const catWeb = await Category.create({ name: 'Lập trình Web', slug: 'lap-trinh-web' });
    const catDesign = await Category.create({ name: 'UI/UX Design', slug: 'ui-ux-design' });
    const catData = await Category.create({ name: 'Khoa học dữ liệu', slug: 'khoa-hoc-du-lieu' });
    const catBiz = await Category.create({ name: 'Marketing & Kinh doanh', slug: 'marketing-kinh-doanh' });

    // Cập nhật sở thích (Preferences) cho Student 1
    student1.preferences = [catWeb._id, catDesign._id];
    await student1.save({ validateBeforeSave: false });

    // 4. Tạo Courses
    console.log('🌱 Seeding Courses...');
    const courseReact = await Course.create({
      title: 'React.js Zero to Hero 2026',
      description: 'Khóa học React.js toàn diện nhất từ cơ bản đến nâng cao. Xây dựng ứng dụng thực tế với Redux, React Query, và Hooks.',
      price: 599000,
      instructor: teacherA._id,
      category: catWeb._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
      averageRating: 4.8
    });

    const courseUIUX = await Course.create({
      title: 'UI/UX Masterclass: Thiết kế ứng dụng triệu đô',
      description: 'Học cách thiết kế trải nghiệm người dùng tuyệt vời với Figma. Quy trình từ wireframe đến prototype hoàn chỉnh.',
      price: 799000,
      instructor: teacherB._id,
      category: catDesign._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
      averageRating: 4.9
    });

    const coursePython = await Course.create({
      title: 'Python for Data Science',
      description: 'Phân tích dữ liệu với Python, Pandas, Numpy. Trực quan hóa dữ liệu với Matplotlib và Seaborn.',
      price: 450000,
      instructor: teacherA._id,
      category: catData._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
      averageRating: 4.5
    });

    const c1 = await Course.create({
      title: 'Node.js & Express API Development',
      description: 'Xây dựng RESTful API mạnh mẽ với Node.js, Express và MongoDB. Bao gồm Authentication, Middleware, và Deployment.',
      price: 650000,
      instructor: teacherA._id,
      category: catWeb._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1627398225058-f4f408731eb1?w=800&q=80',
      averageRating: 4.7
    });

    const c2 = await Course.create({
      title: 'Fullstack Next.js 14 Masterclass',
      description: 'Khóa học Next.js 14 App Router, Server Actions, Prisma, PostgreSQL và TailwindCSS.',
      price: 890000,
      instructor: teacherB._id,
      category: catWeb._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
      averageRating: 4.9
    });

    const c3 = await Course.create({
      title: 'Advanced CSS Animations',
      description: 'Thổi hồn vào website của bạn với CSS Animations, Keyframes, và Transitions nâng cao.',
      price: 350000,
      instructor: teacherA._id,
      category: catWeb._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&q=80',
      averageRating: 4.6
    });

    const c4 = await Course.create({
      title: 'Figma to Webflow Masterclass',
      description: 'Thiết kế trên Figma và chuyển đổi sang Webflow một cách chuyên nghiệp không cần code.',
      price: 550000,
      instructor: teacherB._id,
      category: catDesign._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80',
      averageRating: 4.8
    });

    const c5 = await Course.create({
      title: 'UX Research Fundamentals',
      description: 'Nghiên cứu người dùng, phỏng vấn, tạo User Persona và User Journey Maps chuẩn UX.',
      price: 490000,
      instructor: teacherA._id,
      category: catDesign._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80',
      averageRating: 4.7
    });

    const c6 = await Course.create({
      title: 'Machine Learning cơ bản với Scikit-Learn',
      description: 'Hiểu các thuật toán ML như Linear Regression, Decision Trees, SVM và áp dụng với Python.',
      price: 790000,
      instructor: teacherB._id,
      category: catData._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&q=80',
      averageRating: 4.8
    });

    const c7 = await Course.create({
      title: 'SQL for Data Analysts',
      description: 'Học truy vấn SQL từ cơ bản đến nâng cao: JOIN, Window Functions, CTEs cho phân tích dữ liệu.',
      price: 390000,
      instructor: teacherA._id,
      category: catData._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
      averageRating: 4.6
    });

    const c8 = await Course.create({
      title: 'Digital Marketing Strategy 2026',
      description: 'Xây dựng chiến lược Marketing số toàn diện trên các nền tảng Facebook, Google, TikTok.',
      price: 600000,
      instructor: teacherB._id,
      category: catBiz._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80',
      averageRating: 4.7
    });

    const c9 = await Course.create({
      title: 'SEO Mastery: Lên đỉnh Google',
      description: 'Tối ưu hóa công cụ tìm kiếm, On-page, Off-page, và Technical SEO thực chiến.',
      price: 450000,
      instructor: teacherA._id,
      category: catBiz._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1562577309-4932fdd64cd1?w=800&q=80',
      averageRating: 4.5
    });

    const c10 = await Course.create({
      title: 'Bán hàng B2B chuyên nghiệp',
      description: 'Kỹ năng chốt sale, đàm phán hợp đồng giá trị lớn, và duy trì quan hệ khách hàng doanh nghiệp.',
      price: 850000,
      instructor: teacherB._id,
      category: catBiz._id,
      status: 'published',
      thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-5973dc0f32b7?w=800&q=80',
      averageRating: 4.9
    });

    // 5. Tạo Lessons
    console.log('🌱 Seeding Lessons...');
    const reactLessons = await Lesson.insertMany([
      { course: courseReact._id, title: 'Chương 1: Giới thiệu về React.js', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', duration: 596, order: 1 },
      { course: courseReact._id, title: 'Chương 1: Cài đặt môi trường', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: 653, order: 2 },
      { course: courseReact._id, title: 'Chương 2: JSX và Components', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10, order: 3 },
      { course: courseReact._id, title: 'Chương 2: State và Props', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: 900, order: 4 },
      { course: courseReact._id, title: 'Chương 3: React Hooks (useState & useEffect)', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', duration: 1200, order: 5 },
      { course: courseReact._id, title: 'Chương 3: Custom Hooks', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', duration: 850, order: 6 },
      { course: courseReact._id, title: 'Chương 4: Quản lý State với Redux Toolkit', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', duration: 1500, order: 7 },
      { course: courseReact._id, title: 'Chương 4: React Query cơ bản', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', duration: 3100, order: 8 }
    ]);

    const uiuxLessons = await Lesson.insertMany([
      { course: courseUIUX._id, title: 'Module 1: Nguyên lý thiết kế UI/UX', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', duration: 734, order: 1 },
      { course: courseUIUX._id, title: 'Module 1: Typography trong Design', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10, order: 2 },
      { course: courseUIUX._id, title: 'Module 2: Làm quen với Figma', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4', duration: 1100, order: 3 },
      { course: courseUIUX._id, title: 'Module 2: Xây dựng Design System', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4', duration: 850, order: 4 },
      { course: courseUIUX._id, title: 'Module 3: Prototyping cơ bản', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4', duration: 1200, order: 5 },
      { course: courseUIUX._id, title: 'Module 3: Phân tích trải nghiệm người dùng', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', duration: 900, order: 6 }
    ]);

    const pythonLessons = await Lesson.insertMany([
      { course: coursePython._id, title: 'Phần 1: Cài đặt Python và Jupyter', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', duration: 650, order: 1 },
      { course: coursePython._id, title: 'Phần 1: Cú pháp cơ bản', videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', duration: 10, order: 2 },
      { course: coursePython._id, title: 'Phần 2: Data Structures (List, Dict, Tuple)', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', duration: 800, order: 3 },
      { course: coursePython._id, title: 'Phần 2: Loops và Functions', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', duration: 950, order: 4 },
      { course: coursePython._id, title: 'Phần 3: Giới thiệu về Pandas', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', duration: 3100, order: 5 },
      { course: coursePython._id, title: 'Phần 3: Trực quan hóa với Matplotlib', videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', duration: 1400, order: 6 }
    ]);

    const extraLessons = [];
    const videoSamples = [
      'https://www.w3schools.com/html/mov_bbb.mp4', // short
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    ];
    
    // Tạo 4 bài học mẫu cho 10 khóa học mới (c1 -> c10)
    const newCourses = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10];
    newCourses.forEach((c) => {
      extraLessons.push(
        { course: c._id, title: 'Chương 1: Bắt đầu nhanh', videoUrl: videoSamples[0], duration: 10, order: 1 },
        { course: c._id, title: 'Chương 1: Kiến thức nền tảng', videoUrl: videoSamples[1], duration: 653, order: 2 },
        { course: c._id, title: 'Chương 2: Cốt lõi và thực hành', videoUrl: videoSamples[2], duration: 596, order: 3 },
        { course: c._id, title: 'Chương 2: Ứng dụng nâng cao', videoUrl: videoSamples[3], duration: 3100, order: 4 }
      );
    });
    
    await Lesson.insertMany(extraLessons);

    // 6. Tạo Quizzes
    console.log('🌱 Seeding Quizzes...');
    const quizReact = await Quiz.create({
      course: courseReact._id,
      title: 'Kiểm tra giữa kỳ: Hooks & Components',
      passingScore: 70,
      timeLimit: 30,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày tới
    });

    // 7. Tạo Enrollments & Progress
    console.log('🌱 Seeding Enrollments & Progress...');
    
    // Student 1: React (Hoàn thành 100%), UIUX (Đang học dở 66%)
    await Enrollment.create({ student: student1._id, course: courseReact._id, paymentStatus: 'completed' });
    await Progress.create({
      student: student1._id,
      course: courseReact._id,
      completedLessons: reactLessons.map(l => l._id),
      progressPercentage: 100,
      isCompleted: true,
      lastAccessedLesson: reactLessons[4]._id,
      lastStudiedAt: new Date()
    });

    await Enrollment.create({ student: student1._id, course: courseUIUX._id, paymentStatus: 'completed' });
    await Progress.create({
      student: student1._id,
      course: courseUIUX._id,
      completedLessons: [uiuxLessons[0]._id, uiuxLessons[1]._id],
      progressPercentage: 66,
      isCompleted: false,
      lastAccessedLesson: uiuxLessons[2]._id,
      lastStudiedAt: new Date(),
      videoProgress: { [uiuxLessons[2]._id.toString()]: 300 } // Đang xem dở bài 3 ở phút thứ 5
    });

    // Student 2: Python (Mới mua)
    await Enrollment.create({ student: student2._id, course: coursePython._id, paymentStatus: 'completed' });
    await Progress.create({
      student: student2._id,
      course: coursePython._id,
      completedLessons: [],
      progressPercentage: 0,
      isCompleted: false
    });

    // 8. Tạo Reviews
    console.log('🌱 Seeding Reviews...');
    await Review.create({
      student: student1._id,
      course: courseReact._id,
      rating: 5,
      comment: 'Giảng viên dạy quá hay, dễ hiểu! Khóa học cực kỳ chất lượng.',
      instructorReply: 'Cảm ơn bạn đã đồng hành cùng khóa học!'
    });
    
    await Review.create({
      student: student2._id,
      course: courseReact._id,
      rating: 4,
      comment: 'Nội dung tốt nhưng bài tập hơi khó.'
    });

    // 9. Tạo Notifications
    console.log('🌱 Seeding Notifications...');
    await Notification.insertMany([
      { recipient: student1._id, title: 'Đăng ký thành công', message: 'Bạn đã đăng ký thành công khóa học UI/UX Masterclass.', type: 'payment', isRead: true },
      { recipient: student1._id, title: 'Nhắc nhở học tập', message: 'Bạn đang xem dở bài "Xây dựng Design System". Tiếp tục học ngay!', type: 'system', link: `/courses/${courseUIUX._id}/learn` },
      { recipient: student1._id, title: 'Kiểm tra sắp tới', message: 'Bài kiểm tra "Hooks & Components" sẽ hết hạn vào tuần sau.', type: 'course', link: `/courses/${courseReact._id}/quizzes/${quizReact._id}/take` },
      { recipient: teacherA._id, title: 'Đánh giá mới', message: 'Alex Developer vừa đánh giá 5 sao cho khóa học của bạn.', type: 'course' }
    ]);

    // Thêm Wishlist cho Student 1
    student1.wishlist.push(coursePython._id);
    await student1.save({ validateBeforeSave: false });

    console.log('✅ THÀNH CÔNG: Toàn bộ dữ liệu mẫu đã được seed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi Seeding:', error);
    process.exit(1);
  }
}

seed();
