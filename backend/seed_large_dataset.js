require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const slugify = require('slugify');

const User = require('./src/models/User');
const Category = require('./src/models/Category');
const Course = require('./src/models/Course');
const Lesson = require('./src/models/Lesson');
const Quiz = require('./src/models/Quiz');
const Question = require('./src/models/Question');
const Result = require('./src/models/Result');
const Enrollment = require('./src/models/Enrollment');
const Progress = require('./src/models/Progress');
const Review = require('./src/models/Review');
const Notification = require('./src/models/Notification');
const TeacherApplication = require('./src/models/TeacherApplication');
const PayoutRequest = require('./src/models/PayoutRequest');
const AuditLog = require('./src/models/AuditLog');
const Order = require('./src/models/Order');
const Certificate = require('./src/models/Certificate');

// Generator Helpers
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomDate = (daysAgoMax = 90) => {
  const date = new Date();
  date.setDate(date.getDate() - getRandomInt(0, daysAgoMax));
  date.setHours(getRandomInt(8, 22), getRandomInt(0, 59), getRandomInt(0, 59));
  return date;
};

const CATEGORIES_DATA = [
  { name: 'Web Development', icon: 'code', description: 'Master Frontend, Backend and Fullstack development technologies.' },
  { name: 'Data Science & AI', icon: 'brain', description: 'Machine Learning, Deep Learning, Data Analytics, Python & R.' },
  { name: 'Mobile App Development', icon: 'smartphone', description: 'Build iOS and Android apps using React Native, Flutter & Swift.' },
  { name: 'Cloud & DevOps', icon: 'cloud', description: 'Docker, Kubernetes, AWS, Azure, CI/CD pipelines & Microservices.' },
  { name: 'Cyber Security', icon: 'shield', description: 'Ethical Hacking, Network Security, Cryptography & Penetration Testing.' },
  { name: 'UI/UX Design', icon: 'palette', description: 'User Experience, Figma, Interaction Design, Wireframing & Prototyping.' },
  { name: 'Digital Marketing', icon: 'trending-up', description: 'SEO, Content Strategy, Social Media Marketing & Analytics.' },
  { name: 'Business & Management', icon: 'briefcase', description: 'Project Management, Agile, Leadership & Financial Planning.' },
  { name: 'Database Administration', icon: 'database', description: 'SQL, NoSQL, MongoDB, PostgreSQL, Database Optimization & Scaling.' },
  { name: 'Game Development', icon: 'gamepad-2', description: 'Unity, Unreal Engine 5, C# & 3D Game Architecture.' }
];

const TEACHER_NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Dr. Robert Vance', 'Elena Rostova', 
  'David Miller', 'Nguyen Van Thanh', 'Tran Thi Mai', 'Jessica Taylor', 
  'Marcus Aurelius', 'Sophia Martinez', 'Alexander Wright', 'Le Hoang Nam', 
  'Hiroshi Tanaka', 'Chloe Dubois', 'Viktor Krum', 'Amara Diallo'
];

const FIRST_NAMES = ['Minh', 'Anh', 'Hoang', 'Linh', 'Duy', 'Phuong', 'Tu', 'Vy', 'Dat', 'Huy', 'Khoa', 'Trang', 'Son', 'Tuan', 'Bao', 'Kien', 'Liam', 'Noah', 'Emma', 'Olivia', 'Ava', 'Ethan', 'Lucas', 'Sophia', 'Isabella', 'Mia', 'James', 'Benjamin'];
const LAST_NAMES = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Phan', 'Vu', 'Dang', 'Bui', 'Do', 'Ho', 'Ngo', 'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

// Giá VND thực tế
const COURSE_SUBJECTS = [
  { title: 'Fullstack React & Node.js Masterclass 2026', catIdx: 0, price: 1290000, level: 'All Levels' },
  { title: 'Advanced Vue 3 & Nuxt Enterprise Patterns', catIdx: 0, price: 990000, level: 'Intermediate' },
  { title: 'Modern TypeScript & Micro-Frontend Architecture', catIdx: 0, price: 1190000, level: 'Advanced' },
  { title: 'Python for Data Science & Machine Learning Bootcamp', catIdx: 1, price: 1490000, level: 'Beginner' },
  { title: 'Deep Learning with PyTorch & Neural Networks', catIdx: 1, price: 1890000, level: 'Advanced' },
  { title: 'Generative AI & LLM Application Engineering', catIdx: 1, price: 2490000, level: 'Intermediate' },
  { title: 'React Native & Expo: Build iOS & Android Apps', catIdx: 2, price: 1090000, level: 'Intermediate' },
  { title: 'Flutter 3 & Dart: Complete Cross-Platform Guide', catIdx: 2, price: 1290000, level: 'Beginner' },
  { title: 'Docker, Kubernetes & Terraform in Production', catIdx: 3, price: 1590000, level: 'Advanced' },
  { title: 'AWS Certified Solutions Architect Training', catIdx: 3, price: 1790000, level: 'Intermediate' },
  { title: 'Certified Ethical Hacker (CEH) Hands-on Lab', catIdx: 4, price: 1990000, level: 'Intermediate' },
  { title: 'Figma UI/UX Masterclass: From Wireframe to Prototype', catIdx: 5, price: 790000, level: 'Beginner' },
  { title: 'MongoDB Architecture, Sharding & Query Optimization', catIdx: 8, price: 1190000, level: 'Advanced' },
  { title: 'PostgreSQL High Availability & Performance Tuning', catIdx: 8, price: 1290000, level: 'Intermediate' },
  { title: 'Unreal Engine 5 C++ Action RPG Development', catIdx: 9, price: 1890000, level: 'Advanced' },
  { title: 'Unity 2D/3D Mobile Game Design', catIdx: 9, price: 990000, level: 'Beginner' },
  { title: 'Agile & Scrum Product Management Masterclass', catIdx: 7, price: 790000, level: 'All Levels' },
  { title: 'Complete SEO & Content Marketing Strategy 2026', catIdx: 6, price: 590000, level: 'Beginner' },
  { title: 'Building RESTful APIs with Go & Fiber Engine', catIdx: 0, price: 1090000, level: 'Intermediate' },
  { title: 'Rust Systems Programming & Memory Safety', catIdx: 0, price: 1390000, level: 'Advanced' }
];

async function seedLargeDataset() {
  const startTime = Date.now();
  console.log('🚀 Starting Large Scale Performance Dataset Seeding...');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB Atlas/Local DB.');

    // 1. Clean old data
    console.log('🗑️ Purging existing records...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Course.deleteMany({}),
      Lesson.deleteMany({}),
      Quiz.deleteMany({}),
      Question.deleteMany({}),
      Result.deleteMany({}),
      Enrollment.deleteMany({}),
      Progress.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
      Order.deleteMany({}),
      TeacherApplication.deleteMany({}),
      PayoutRequest.deleteMany({}),
      AuditLog.deleteMany({}),
      Certificate.deleteMany({})
    ]);

    // 2. Hash default password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 3. Create Admin
    console.log('👤 Creating Admin user...');
    const [adminUser] = await User.insertMany([{
      name: 'System SuperAdmin',
      email: 'admin@elearning.com',
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff'
    }]);

    // 4. Create Teachers (20)
    console.log('👨‍🏫 Creating 20 Instructor users...');
    const teacherDocs = [];
    for (let i = 0; i < TEACHER_NAMES.length; i++) {
      const name = TEACHER_NAMES[i];
      const email = `teacher${i + 1}@elearning.com`;
      teacherDocs.push({
        name,
        email,
        password: hashedPassword,
        role: 'teacher',
        isVerified: true,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0284c7&color=fff`
      });
    }
    const createdTeachers = await User.insertMany(teacherDocs);

    // 5. Create Students (450)
    console.log('🎓 Creating 450 Student users with Gamification Stats...');
    const studentDocs = [];
    for (let i = 1; i <= 450; i++) {
      const fname = getRandomChoice(FIRST_NAMES);
      const lname = getRandomChoice(LAST_NAMES);
      const name = `${fname} ${lname}`;
      const email = `student${i}@elearning.com`;
      const xp = getRandomInt(100, 45000);
      const level = Math.floor(xp / 1500) + 1;
      const studyStreakDays = getRandomInt(0, 45);
      const totalFocusMinutes = getRandomInt(50, 8500);

      studentDocs.push({
        name,
        email,
        password: hashedPassword,
        role: 'student',
        isVerified: true,
        xp,
        level,
        studyStreakDays,
        totalFocusMinutes,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff`,
        createdAt: getRandomDate(180)
      });
    }
    const createdStudents = await User.insertMany(studentDocs);
    console.log(`✅ Total Users Created: ${1 + createdTeachers.length + createdStudents.length}`);

    // 6. Create Categories (10)
    console.log('📂 Seeding 10 Categories...');
    const categoryDocs = CATEGORIES_DATA.map(c => ({
      name: c.name,
      slug: slugify(c.name, { lower: true, strict: true }),
      icon: c.icon,
      description: c.description
    }));
    const createdCategories = await Category.insertMany(categoryDocs);

    // 7. Create Courses (60 Courses with VND prices)
    console.log('📚 Seeding 60 Real-world Courses (Giá VNĐ)...');
    const courseDocs = [];
    for (let i = 0; i < 60; i++) {
      const template = COURSE_SUBJECTS[i % COURSE_SUBJECTS.length];
      const category = createdCategories[template.catIdx % createdCategories.length];
      const teacher = createdTeachers[i % createdTeachers.length];
      const title = i >= COURSE_SUBJECTS.length ? `${template.title} (Khóa mở rộng #${Math.floor(i / 20) + 1})` : template.title;
      const slug = slugify(title, { lower: true, strict: true }) + `-${i + 1}`;
      const price = template.price;
      const estimatedPrice = Math.round(price * 1.3);
      const discountPercentage = 20;

      courseDocs.push({
        title,
        slug,
        description: `Khóa học toàn diện hướng dẫn kiến thức và thực hành chuyên sâu về ${title}. Thiết kế bài giảng chuẩn doanh nghiệp, project thực tế và lộ trình bài bản.`,
        category: category._id,
        instructor: teacher._id,
        price,
        estimatedPrice,
        discountPercentage,
        level: template.level,
        status: i % 10 === 9 ? 'pending_review' : (i % 15 === 14 ? 'draft' : 'published'),
        thumbnailUrl: `https://picsum.photos/seed/course${i + 100}/800/450`,
        averageRating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
        reviewCount: getRandomInt(5, 120),
        enrolledCount: getRandomInt(20, 850),
        createdAt: getRandomDate(120)
      });
    }
    const createdCourses = await Course.insertMany(courseDocs);

    // 8. Create Lessons & Quizzes per course
    console.log('🎬 Seeding 700+ Lessons, 120+ Quizzes & 1,200+ Questions...');
    const lessonDocs = [];
    const quizDocs = [];
    const questionDocs = [];

    for (let cIdx = 0; cIdx < createdCourses.length; cIdx++) {
      const course = createdCourses[cIdx];
      const lessonCount = getRandomInt(10, 15);

      for (let lIdx = 1; lIdx <= lessonCount; lIdx++) {
        const lessonId = new mongoose.Types.ObjectId();
        const durationSeconds = getRandomInt(300, 2400);

        lessonDocs.push({
          _id: lessonId,
          title: `Bài ${lIdx}: Tìm hiểu kiến thức nền tảng ${course.title.split(' ')[0]} (Phần ${lIdx})`,
          description: `Nội dung chi tiết bài học số ${lIdx}. Thực hành trực tiếp và giải thích chi tiết các mẫu thiết kế.`,
          course: course._id,
          videoUrl: `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4`,
          duration: durationSeconds,
          order: lIdx,
          isPreview: lIdx === 1,
          createdAt: course.createdAt
        });

        // Add Quiz to every 4th lesson
        if (lIdx % 4 === 0) {
          const quizId = new mongoose.Types.ObjectId();
          quizDocs.push({
            _id: quizId,
            course: course._id,
            lesson: lessonId,
            title: `Bài kiểm tra Module ${lIdx}: Đánh giá ${course.title.split(' ')[0]}`,
            timeLimit: 15,
            passingScore: 70,
            dueDate: getRandomDate(-30)
          });

          // Add 5 Questions per Quiz
          for (let q = 1; q <= 5; q++) {
            const correctIdx = getRandomInt(0, 3);
            const rawOptions = [
              `Tính bất biến và xử lý chức năng thuần túy cho module ${lIdx}`,
              `Lưu trữ trạng thái với giao dịch ACID cho module ${lIdx}`,
              `Luồng thực thi bất đồng bộ theo sự kiện cho module ${lIdx}`,
              `Kiến trúc đơn khối đồng bộ cho module ${lIdx}`
            ];

            questionDocs.push({
              quiz: quizId,
              lesson: lessonId,
              text: `Câu hỏi #${q}: Nguyên lý kiến trúc cốt lõi của module ${lIdx} trong ${course.title} là gì?`,
              points: 1,
              options: rawOptions.map((optText, idx) => ({
                text: optText,
                isCorrect: idx === correctIdx
              })),
              explanation: `Đáp án '${rawOptions[correctIdx]}' là chính xác vì nó giúp hệ thống mở rộng linh hoạt và nâng cao khả năng chịu lỗi.`
            });
          }
        }
      }
    }

    const createdLessons = await Lesson.insertMany(lessonDocs);
    const createdQuizzes = await Quiz.insertMany(quizDocs);
    const createdQuestions = await Question.insertMany(questionDocs);
    console.log(`✅ Created ${createdLessons.length} Lessons, ${createdQuizzes.length} Quizzes, ${createdQuestions.length} Questions.`);

    // 9. Create Enrollments, Progress, Orders & CERTIFICATES
    console.log('📈 Seeding Enrollments, Orders (VNĐ) & Generating Certificates for Graduates...');
    const enrollmentDocs = [];
    const progressDocs = [];
    const orderDocs = [];
    const resultDocs = [];
    const reviewDocs = [];
    const certificateDocs = [];

    const lessonsByCourse = {};
    createdLessons.forEach(l => {
      if (!lessonsByCourse[l.course.toString()]) lessonsByCourse[l.course.toString()] = [];
      lessonsByCourse[l.course.toString()].push(l);
    });

    const quizzesByCourse = {};
    createdQuizzes.forEach(q => {
      if (!quizzesByCourse[q.course.toString()]) quizzesByCourse[q.course.toString()] = [];
      quizzesByCourse[q.course.toString()].push(q);
    });

    const publishedCourses = createdCourses.filter(c => c.status === 'published');

    for (let sIdx = 0; sIdx < createdStudents.length; sIdx++) {
      const student = createdStudents[sIdx];
      const enrolledCount = getRandomInt(3, 8);
      const shuffledCourses = [...publishedCourses].sort(() => 0.5 - Math.random()).slice(0, enrolledCount);

      for (let cIdx = 0; cIdx < shuffledCourses.length; cIdx++) {
        const course = shuffledCourses[cIdx];
        const enrolledDate = getRandomDate(90);
        const courseLessons = lessonsByCourse[course._id.toString()] || [];

        // Ép buộc ~ 25% các khóa học đăng ký của học sinh đạt 100% hoàn thành để cấp chứng chỉ
        const forceComplete = (sIdx + cIdx) % 4 === 0;
        const completedCount = forceComplete ? courseLessons.length : getRandomInt(0, Math.max(0, courseLessons.length - 1));
        const completedLessons = courseLessons.slice(0, completedCount).map(l => l._id);
        const progressPercentage = courseLessons.length > 0 ? Math.round((completedCount / courseLessons.length) * 100) : 0;
        const isCompleted = progressPercentage === 100;

        // Enrollment
        enrollmentDocs.push({
          student: student._id,
          course: course._id,
          enrolledAt: enrolledDate,
          progress: progressPercentage,
          completedLessons,
          paymentStatus: 'completed'
        });

        // Progress
        progressDocs.push({
          student: student._id,
          course: course._id,
          completedLessons,
          progressPercentage,
          lastAccessedLesson: courseLessons.length > 0 ? courseLessons[Math.min(completedCount, courseLessons.length - 1)]._id : null,
          isCompleted,
          lastStudiedAt: getRandomDate(30),
          videoProgress: courseLessons.length > 0 ? { [courseLessons[0]._id.toString()]: getRandomInt(60, 600) } : {}
        });

        // Order in VNĐ
        orderDocs.push({
          user: student._id,
          course: course._id,
          amount: course.price,
          currency: 'vnd',
          stripePaymentIntentId: `pi_mock_${Math.random().toString(36).substring(2, 15)}`,
          status: 'paid',
          createdAt: enrolledDate
        });

        // Certificate Generation (Cho các học sinh đã hoàn thành 100% khóa học)
        if (isCompleted) {
          const certRand = Math.random().toString(36).substring(2, 8).toUpperCase();
          const certDateHex = Date.now().toString(36).toUpperCase();
          const certificateId = `CERT-${certRand}-${certDateHex}`;

          certificateDocs.push({
            student: student._id,
            course: course._id,
            certificateId,
            issueDate: getRandomDate(20),
            pdfUrl: `http://localhost:5000/api/certificates/${certificateId}/pdf`,
            validationUrl: `http://localhost:3000/certificates/verify/${certificateId}`,
            qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=http://localhost:3000/certificates/verify/${certificateId}`
          });
        }

        // Quiz Results
        const courseQuizzes = quizzesByCourse[course._id.toString()] || [];
        if (courseQuizzes.length > 0 && completedCount > 0) {
          const quizToTake = getRandomChoice(courseQuizzes);
          const scorePercentage = getRandomInt(50, 100);
          const score = Math.round((scorePercentage / 100) * 5);
          resultDocs.push({
            quiz: quizToTake._id,
            student: student._id,
            score,
            scorePercentage,
            isPassed: scorePercentage >= quizToTake.passingScore,
            createdAt: getRandomDate(30)
          });
        }

        // Reviews
        if (Math.random() < 0.3) {
          const rating = getRandomInt(4, 5);
          reviewDocs.push({
            student: student._id,
            course: course._id,
            rating,
            comment: `Khóa học xuất sắc! Giảng viên giảng dạy về ${course.title.split(' ')[0]} rất truyền cảm hứng, bài tập sát thực tế.`,
            createdAt: getRandomDate(45)
          });
        }
      }
    }

    await Enrollment.insertMany(enrollmentDocs);
    await Progress.insertMany(progressDocs);
    await Order.insertMany(orderDocs);
    await Result.insertMany(resultDocs);
    await Review.insertMany(reviewDocs);
    const createdCertificates = await Certificate.insertMany(certificateDocs);

    console.log(`✅ Inserted ${enrollmentDocs.length} Enrollments, ${progressDocs.length} Progress, ${orderDocs.length} VNĐ Orders, ${resultDocs.length} Quiz Results, ${reviewDocs.length} Reviews & ${createdCertificates.length} Certificates.`);

    // 10. Create Admin Audit Logs & Notifications
    console.log('📑 Seeding 1,000+ Notifications & Audit Logs...');
    const notificationDocs = [];
    const auditLogDocs = [];

    const actions = ['USER_ROLE_UPDATED', 'USER_SUSPENDED', 'COURSE_APPROVED', 'COURSE_REJECTED', 'PAYOUT_COMPLETED', 'CATEGORY_CREATED'];
    for (let i = 0; i < 500; i++) {
      const student = getRandomChoice(createdStudents);
      notificationDocs.push({
        recipient: student._id,
        title: `Cập nhật hệ thống #${i + 1}`,
        message: `Chuỗi ngày học của bạn đang tích cực! Tiếp tục giữ vững phong độ để tăng level.`,
        type: getRandomChoice(['system', 'course', 'payment', 'certificate']),
        isRead: Math.random() < 0.5,
        createdAt: getRandomDate(60)
      });

      auditLogDocs.push({
        actor: adminUser._id,
        action: getRandomChoice(actions),
        targetModel: getRandomChoice(['User', 'Course', 'PayoutRequest', 'Category']),
        targetId: student._id,
        details: { note: `Automated audit log entry #${i + 1} for high-load testing.` },
        createdAt: getRandomDate(60)
      });
    }

    await Notification.insertMany(notificationDocs);
    await AuditLog.insertMany(auditLogDocs);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n🎉 MASSIVE PERFORMANCE DATASET SEEDED SUCCESSFULLY IN ${duration}s!`);
    console.log(`📊 SUMMARY METRICS:`);
    console.log(`   • Users: ${1 + createdTeachers.length + createdStudents.length} (1 Admin, 20 Teachers, 450 Students)`);
    console.log(`   • Categories: ${createdCategories.length}`);
    console.log(`   • Courses: ${createdCourses.length} (Giá VNĐ: 590,000đ - 2,490,000đ)`);
    console.log(`   • Lessons: ${createdLessons.length}`);
    console.log(`   • Quizzes: ${createdQuizzes.length}`);
    console.log(`   • Questions: ${createdQuestions.length}`);
    console.log(`   • Certificates Issued: ${createdCertificates.length}`);
    console.log(`   • Enrollments & Progress: ${enrollmentDocs.length}`);
    console.log(`   • Orders & Transactions (VNĐ): ${orderDocs.length}`);
    console.log(`   • Quiz Results: ${resultDocs.length}`);
    console.log(`   • Reviews: ${reviewDocs.length}`);
    console.log(`   • Audit Logs & Notifications: ${auditLogDocs.length + notificationDocs.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedLargeDataset();
