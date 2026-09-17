const BaseRepository = require('./base.repository');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');

class ModuleRepository extends BaseRepository {
  constructor() {
    super(Module);
  }

  // Lấy các module theo khóa học sắp xếp theo order
  async findByCourseId(courseId) {
    if (!courseId) return [];
    return await this.model.find({ course: courseId }).sort({ order: 1 }).lean();
  }

  // Lấy các module kèm danh sách lessons con của từng module
  async findByCourseIdWithLessons(courseId) {
    if (!courseId) return [];
    
    // 1. Lấy tất cả modules của course
    const modules = await this.model.find({ course: courseId }).sort({ order: 1 }).lean();
    
    // 2. Lấy tất cả lessons của course
    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 }).lean();

    // 3. Map lessons vào module tương ứng
    const lessonsByModule = {};
    const unassignedLessons = [];

    for (const lesson of lessons) {
      const modId = lesson.module ? lesson.module.toString() : null;
      if (modId) {
        if (!lessonsByModule[modId]) lessonsByModule[modId] = [];
        lessonsByModule[modId].push(lesson);
      } else {
        unassignedLessons.push(lesson);
      }
    }

    // Gán lessons vào từng module
    const resultModules = modules.map(mod => ({
      ...mod,
      lessons: lessonsByModule[mod._id.toString()] || []
    }));

    // Nếu có bài học chưa gán module (trường hợp hiếm hoặc trước migration), thêm vào module ảo hoặc gán vào module đầu tiên
    if (unassignedLessons.length > 0) {
      if (resultModules.length > 0) {
        resultModules[0].lessons = [...unassignedLessons, ...resultModules[0].lessons];
      } else {
        resultModules.push({
          _id: 'default',
          course: courseId,
          title: 'Chương 1: Nội dung khóa học',
          description: '',
          order: 0,
          lessons: unassignedLessons
        });
      }
    }

    return resultModules;
  }
}

module.exports = new ModuleRepository();
