const moduleRepository = require('../repositories/module.repository');
const courseRepository = require('../repositories/course.repository');
const lessonRepository = require('../repositories/lesson.repository');
const enrollmentRepository = require('../repositories/enrollment.repository');
const AppError = require('../utils/appError');

class ModuleService {
  // Lấy toàn bộ module kèm bài học của khóa học
  async getModulesByCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    let hasFullAccess = false;
    try {
      const instructorId = course.instructor && course.instructor._id 
        ? course.instructor._id.toString() 
        : course.instructor ? course.instructor.toString() : '';
      const isInstructor = user && instructorId && instructorId === user.id;

      if (user && user.role === 'admin') {
        hasFullAccess = true;
      } else if (user && user.role === 'teacher' && isInstructor) {
        hasFullAccess = true;
      } else if (user && user.id) {
        const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
        if (enrollment && enrollment.paymentStatus === 'completed') {
          hasFullAccess = true;
        }
      }
    } catch (e) {
      console.error('Lỗi khi kiểm tra phân quyền module:', e);
    }

    const modulesWithLessons = await moduleRepository.findByCourseIdWithLessons(courseId);

    if (!hasFullAccess) {
      // Ẩn link video với người chưa mua khóa học (ngoại trừ bài học Free Preview)
      return modulesWithLessons.map(mod => ({
        ...mod,
        lessons: (mod.lessons || []).map(lesson => {
          const doc = { ...lesson };
          if (!doc.isFreePreview && !doc.isPreview) {
            delete doc.videoUrl;
            delete doc.videoPublicId;
          }
          return doc;
        })
      }));
    }

    return modulesWithLessons;
  }

  async getModuleById(moduleId, courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    const mod = await moduleRepository.findOne({ _id: moduleId, course: courseId });
    if (!mod) {
      throw new AppError('Không tìm thấy chương học này', 404);
    }

    return mod;
  }

  async createModule(courseId, moduleData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền thêm chương học vào khóa học của người khác', 403);
    }

    moduleData.course = courseId;

    if (moduleData.order === undefined || moduleData.order === null) {
      const existingModules = await moduleRepository.findByCourseId(courseId);
      moduleData.order = existingModules.length + 1;
    }

    return await moduleRepository.create(moduleData);
  }

  async updateModule(moduleId, courseId, updateData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền sửa chương học này', 403);
    }

    const existingModule = await moduleRepository.findOne({ _id: moduleId, course: courseId });
    if (!existingModule) {
      throw new AppError('Không tìm thấy chương học', 404);
    }

    return await moduleRepository.findOneAndUpdate(
      { _id: moduleId, course: courseId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async deleteModule(moduleId, courseId, cascade = false, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xóa chương học này', 403);
    }

    const existingModule = await moduleRepository.findOne({ _id: moduleId, course: courseId });
    if (!existingModule) {
      throw new AppError('Không tìm thấy chương học', 404);
    }

    // Kiểm tra xem module có chứa bài học hay không
    const lessonsCount = await lessonRepository.countDocuments({ module: moduleId });

    if (lessonsCount > 0 && !cascade) {
      throw new AppError(
        `Chương học đang chứa ${lessonsCount} bài học. Vui lòng di chuyển hoặc xóa các bài học trước, hoặc xác nhận xóa kèm toàn bộ bài học bên trong.`,
        400,
        'MODULE_HAS_LESSONS'
      );
    }

    // Thực hiện xóa (findOneAndDelete kích hoạt pre hook xóa cascade lessons)
    return await moduleRepository.findOneAndDelete({ _id: moduleId, course: courseId });
  }

  async reorderModules(courseId, orderedModules, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền sửa khóa học này', 403);
    }

    const bulkOps = orderedModules.map((item) => ({
      updateOne: {
        filter: { _id: item.id, course: courseId },
        update: { order: item.order }
      }
    }));

    if (bulkOps.length > 0) {
      await moduleRepository.bulkWrite(bulkOps);
    }

    return { message: 'Cập nhật thứ tự chương học thành công' };
  }
}

module.exports = new ModuleService();
