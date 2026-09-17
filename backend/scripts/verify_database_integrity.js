require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');

async function verifyIntegrity() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🔍 RUNNING DATABASE INTEGRITY AUDIT...\n');

  const Course = mongoose.connection.db.collection('courses');
  const Module = mongoose.connection.db.collection('modules');
  const Lesson = mongoose.connection.db.collection('lessons');

  const totalCourses = await Course.countDocuments();
  const totalModules = await Module.countDocuments();
  const totalLessons = await Lesson.countDocuments();

  console.log(`- Total Courses: ${totalCourses}`);
  console.log(`- Total Modules: ${totalModules}`);
  console.log(`- Total Lessons: ${totalLessons}\n`);

  // 1. Orphan Modules (Module whose course does not exist)
  const coursesList = await Course.find({}, { projection: { _id: 1 } }).toArray();
  const courseIdSet = new Set(coursesList.map(c => c._id.toString()));

  const allModules = await Module.find({}).toArray();
  const orphanModules = allModules.filter(m => !m.course || !courseIdSet.has(m.course.toString()));
  console.log(`[CHECK 1] Orphan Modules (modules with invalid course): ${orphanModules.length}`);

  // 2. Orphan Lessons (Lesson whose module or course does not exist)
  const moduleIdSet = new Set(allModules.map(m => m._id.toString()));
  const moduleToCourseMap = new Map();
  allModules.forEach(m => {
    moduleToCourseMap.set(m._id.toString(), m.course ? m.course.toString() : '');
  });

  const allLessons = await Lesson.find({}).toArray();
  const orphanLessons = allLessons.filter(l => !l.module || !moduleIdSet.has(l.module.toString()));
  console.log(`[CHECK 2] Orphan Lessons (lessons without valid module): ${orphanLessons.length}`);

  // 3. Cross-course mismatch: lesson.course !== lesson.module.course
  const mismatchLessons = allLessons.filter(l => {
    if (!l.module) return false;
    const modCourse = moduleToCourseMap.get(l.module.toString());
    const lessonCourse = l.course ? l.course.toString() : '';
    return modCourse !== lessonCourse;
  });
  console.log(`[CHECK 3] Cross-course Mismatch (lesson.course !== module.course): ${mismatchLessons.length}`);

  // 4. Missing order
  const lessonsWithoutOrder = allLessons.filter(l => l.order === undefined || l.order === null || isNaN(l.order));
  const modulesWithoutOrder = allModules.filter(m => m.order === undefined || m.order === null || isNaN(m.order));
  console.log(`[CHECK 4] Missing order on Lessons: ${lessonsWithoutOrder.length}`);
  console.log(`[CHECK 5] Missing order on Modules: ${modulesWithoutOrder.length}`);

  console.log('\n=============================================');
  const allPassed = orphanModules.length === 0 && 
                    orphanLessons.length === 0 && 
                    mismatchLessons.length === 0 && 
                    lessonsWithoutOrder.length === 0 && 
                    modulesWithoutOrder.length === 0;

  if (allPassed) {
    console.log('✅ ALL DATABASE INTEGRITY CHECKS PASSED (100% HEALTHY)!');
  } else {
    console.error('❌ INTEGRITY ISSUES DETECTED!');
  }
  console.log('=============================================\n');

  await mongoose.disconnect();
}

verifyIntegrity().catch(console.error);
