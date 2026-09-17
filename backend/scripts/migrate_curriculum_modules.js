require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
require('../src/models/User');
require('../src/models/Category');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');

async function migrateCurriculumModules() {
  console.log('🚀 Starting Curriculum Modules Migration...');
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB.');

  const totalCourses = await Course.countDocuments();
  const totalLessons = await Lesson.countDocuments();
  console.log(`📊 Current state: ${totalCourses} courses, ${totalLessons} lessons.`);

  const courses = await Course.find({}).lean();
  let createdModulesCount = 0;
  let updatedLessonsCount = 0;
  let skippedLessonsCount = 0;

  for (const course of courses) {
    const courseId = course._id;
    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

    if (lessons.length === 0) continue;

    // Kiểm tra xem khóa học đã có module nào chưa
    let existingModules = await Module.find({ course: courseId }).sort({ order: 1 });
    const moduleMap = new Map(); // key: module title (or prefix), value: module doc

    existingModules.forEach(m => {
      const titleStr = typeof m.title === 'string' ? m.title : (m.title?.vi || m.title?.en || '');
      moduleMap.set(titleStr, m);
    });

    // Phân tích cách nhóm bài học
    // 1. Kiểm tra xem có pattern "Chương X:" hay "Module X:" hay "Phần X:" không
    const hasChapterPattern = lessons.some(l => {
      const t = typeof l.title === 'string' ? l.title : (l.title?.vi || l.title?.en || '');
      return /^(Chương|Module|Phần|Chapter)\s+\d+/i.test(t);
    });

    if (hasChapterPattern) {
      // Nhóm theo tiền tố chương
      const groups = new Map(); // chapterKey -> lessons[]
      for (const l of lessons) {
        const titleStr = typeof l.title === 'string' ? l.title : (l.title?.vi || l.title?.en || '');
        const match = titleStr.match(/^(Chương\s+\d+|Module\s+\d+|Phần\s+\d+|Chapter\s+\d+)/i);
        const chapterName = match ? match[1] : 'Chương 1: Tổng quan';
        if (!groups.has(chapterName)) {
          groups.set(chapterName, []);
        }
        groups.get(chapterName).push(l);
      }

      let modOrder = existingModules.length + 1;
      for (const [chapterName, groupLessons] of groups.entries()) {
        let modDoc = moduleMap.get(chapterName);
        if (!modDoc) {
          // Tạo module mới
          modDoc = await Module.create({
            course: courseId,
            title: chapterName,
            description: `Nội dung học tập phần ${chapterName}`,
            order: modOrder++
          });
          moduleMap.set(chapterName, modDoc);
          createdModulesCount++;
        }

        let lessonOrder = 1;
        for (const lesson of groupLessons) {
          lesson.module = modDoc._id;
          lesson.order = lessonOrder++;
          await lesson.save();
          updatedLessonsCount++;
        }
      }
    } else {
      // Nếu bài học dạng "Bài 1", "Bài 2" hoặc tên tự do, nhóm thành các Module hợp lý
      // Chia thành các block 4-5 bài / 1 module
      const blockSize = 4;
      const numModules = Math.max(1, Math.ceil(lessons.length / blockSize));

      const moduleTitles = [
        'Chương 1: Kiến thức nền tảng & Tổng quan',
        'Chương 2: Kỹ thuật cốt lõi & Xử lý chuyên sâu',
        'Chương 3: Thực hành & Tối ưu hóa dự án',
        'Chương 4: Nâng cao & Triển khai thực tế',
        'Chương 5: Tổng kết & Ôn tập mở rộng'
      ];

      for (let mIdx = 0; mIdx < numModules; mIdx++) {
        const modTitle = moduleTitles[mIdx] || `Chương ${mIdx + 1}: Chuyên đề mở rộng ${mIdx + 1}`;
        let modDoc = moduleMap.get(modTitle);
        if (!modDoc) {
          modDoc = await Module.create({
            course: courseId,
            title: modTitle,
            description: `Mục tiêu và kiến thức trọng điểm của ${modTitle}`,
            order: mIdx + 1
          });
          moduleMap.set(modTitle, modDoc);
          createdModulesCount++;
        }

        const chunkLessons = lessons.slice(mIdx * blockSize, (mIdx + 1) * blockSize);
        let lessonOrder = 1;
        for (const lesson of chunkLessons) {
          lesson.module = modDoc._id;
          lesson.order = lessonOrder++;
          await lesson.save();
          updatedLessonsCount++;
        }
      }
    }
  }

  // Kiểm tra tính toàn vẹn sau khi migrate
  const totalModulesAfter = await Module.countDocuments();
  const orphanLessons = await Lesson.countDocuments({ 
    $or: [{ module: null }, { module: { $exists: false } }] 
  });

  console.log('\n=============================================');
  console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('=============================================');
  console.log(`- Modules created: ${createdModulesCount}`);
  console.log(`- Total Modules in DB now: ${totalModulesAfter}`);
  console.log(`- Lessons updated with Module: ${updatedLessonsCount}`);
  console.log(`- Orphan Lessons remaining: ${orphanLessons} (phải là 0)`);
  console.log('=============================================\n');

  await mongoose.disconnect();
}

migrateCurriculumModules().catch((err) => {
  console.error('❌ Migration failed with error:', err);
  process.exit(1);
});
