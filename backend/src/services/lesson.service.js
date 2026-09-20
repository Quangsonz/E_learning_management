const lessonRepository = require('../repositories/lesson.repository');
const moduleRepository = require('../repositories/module.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const enrollmentRepository = require('../repositories/enrollment.repository');

const uploadService = require('./upload.service');

class LessonService {
  // Lấy toàn bộ bài giảng của một khóa học
  async getLessonsByCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    let hasFullAccess = false;
    
    try {
      const instructorId = course.instructor && course.instructor._id 
        ? course.instructor._id.toString() 
        : course.instructor ? course.instructor.toString() : '';
      const isInstructor = user && instructorId && instructorId === String(user.id || user._id);

      if (user && user.role === 'admin') {
        hasFullAccess = true;
      } else if (user && user.role === 'teacher' && isInstructor) {
        hasFullAccess = true;
      } else if (user && (user.id || user._id)) {
        const studentId = user.id || user._id;
        const enrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
        if (enrollment && enrollment.paymentStatus === 'completed') {
          hasFullAccess = true;
        }
      }
    } catch (e) {
      console.error('Lỗi khi kiểm tra phân quyền bài giảng:', e);
    }

    const lessons = await lessonRepository.findByCourseId(courseId);

    if (!hasFullAccess) {
      // Chỉ giấu videoUrl đối với các bài học KHÔNG PHẢI là học thử miễn phí (Free Preview)
      return lessons.map(lesson => {
        const doc = { ...lesson };
        if (!doc.isFreePreview && !doc.isPreview) {
          delete doc.videoUrl;
          delete doc.videoPublicId;
        }
        return doc;
      });
    }

    return lessons;
  }

  async getLessonById(id, courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    const lesson = await lessonRepository.findOne({ _id: id, course: courseId });
    if (!lesson) {
      throw new AppError('Không tìm thấy bài giảng trong khóa học này', 404);
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
      console.error('Lỗi khi kiểm tra phân quyền bài giảng chi tiết:', e);
    }
    
    if (!hasFullAccess) {
      const doc = lesson.toObject ? lesson.toObject() : { ...lesson };
      if (!doc.isFreePreview && !doc.isPreview) {
        delete doc.videoUrl;
        delete doc.videoPublicId;
      }
      return doc;
    }
    
    return lesson;
  }

  async createLesson(courseId, lessonData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    // Chỉ Admin hoặc Giảng viên tạo khóa học mới được thêm bài giảng
    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền thêm bài giảng vào khóa học của người khác', 403);
    }

    lessonData.course = courseId;

    // Xác thực module và đảm bảo lesson luôn thuộc đúng Module
    const targetModuleId = lessonData.moduleId || lessonData.module;
    if (targetModuleId) {
      const foundModule = await moduleRepository.findOne({ _id: targetModuleId, course: courseId });
      if (!foundModule) {
        throw new AppError('Chương học không tồn tại hoặc không thuộc khóa học này', 400);
      }
      lessonData.module = targetModuleId;
    } else {
      // Nếu không truyền module, tìm module đầu tiên của khóa học hoặc tạo default module
      let defaultModule = await moduleRepository.findOne({ course: courseId });
      if (!defaultModule) {
        defaultModule = await moduleRepository.create({
          course: courseId,
          title: 'Chương 1: Giới thiệu & Tổng quan',
          order: 1
        });
      }
      lessonData.module = defaultModule._id;
    }

    // Tự động phát hiện provider nếu chưa có
    const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(lessonData.videoUrl || '');
    if (!lessonData.provider) {
      lessonData.provider = isYouTube ? 'youtube' : 'cloudinary';
    }
    if (isYouTube) {
      lessonData.videoPublicId = null;
    }

    // Tự động gán order nếu không truyền (lấy số bài giảng hiện có trong module + 1)
    if (lessonData.order === undefined || lessonData.order === null) {
      const lessonsInModule = await lessonRepository.find({ module: lessonData.module });
      lessonData.order = lessonsInModule.length + 1;
    }

    if (lessonData.isFreePreview === undefined && lessonData.isPreview !== undefined) {
      lessonData.isFreePreview = Boolean(lessonData.isPreview);
    }

    return await lessonRepository.create(lessonData);
  }

  async updateLesson(id, courseId, updateData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền sửa bài giảng này', 403);
    }

    // Lấy thông tin bài giảng cũ trước khi cập nhật để quản lý lifecycle video
    const existingLesson = await lessonRepository.findOne({ _id: id, course: courseId });
    if (!existingLesson) throw new AppError('Không tìm thấy bài giảng', 404);

    // Xác thực chuyển module nếu có truyền moduleId hoặc module
    if (updateData.moduleId || updateData.module) {
      const targetModuleId = updateData.moduleId || updateData.module;
      const foundModule = await moduleRepository.findOne({ _id: targetModuleId, course: courseId });
      if (!foundModule) {
        throw new AppError('Chương học đích không tồn tại hoặc không thuộc khóa học này', 400);
      }
      updateData.module = targetModuleId;
      delete updateData.moduleId;
    }

    // Tự động phát hiện provider nếu URL thay đổi
    if (updateData.videoUrl && !updateData.provider) {
      const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(updateData.videoUrl);
      updateData.provider = isYouTube ? 'youtube' : 'cloudinary';
      if (isYouTube) {
        updateData.videoPublicId = null;
      }
    }

    if (updateData.isFreePreview === undefined && updateData.isPreview !== undefined) {
      updateData.isFreePreview = Boolean(updateData.isPreview);
    }

    // 1. Cập nhật dữ liệu vào MongoDB trước
    const updatedLesson = await lessonRepository.findOneAndUpdate({ _id: id, course: courseId }, updateData, { new: true, runValidators: true });
    
    // 2. LIFECYCLE: Xóa video cũ trên Cloudinary SAU KHI CẬP NHẬT DATABASE THÀNH CÔNG
    const oldPublicId = existingLesson.videoPublicId;
    const newPublicId = updateData.videoPublicId !== undefined ? updateData.videoPublicId : updatedLesson.videoPublicId;
    const wasCloudinary = existingLesson.provider === 'cloudinary' || (existingLesson.videoUrl && !existingLesson.videoUrl.includes('youtube.com') && !existingLesson.videoUrl.includes('youtu.be'));

    if (wasCloudinary && oldPublicId && oldPublicId !== newPublicId) {
      uploadService.deleteVideo(oldPublicId).catch(err => {
        console.error(`[Cloudinary Replacement Cleanup Error] ${err.message}`);
      });
    }

    return updatedLesson;
  }

  async deleteLesson(id, courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền xóa bài giảng này', 403);
    }

    // Lấy thông tin bài giảng trước khi xóa
    const lessonToDelete = await lessonRepository.findOne({ _id: id, course: courseId });
    if (!lessonToDelete) throw new AppError('Không tìm thấy bài giảng', 404);

    // 1. Xóa trong Database trước
    const lesson = await lessonRepository.findOneAndDelete({ _id: id, course: courseId });
    
    // 2. LIFECYCLE: Xóa video trên Cloudinary SAU KHI XÓA DATABASE THÀNH CÔNG
    const isCloudinary = lessonToDelete.provider === 'cloudinary' || (lessonToDelete.videoUrl && !lessonToDelete.videoUrl.includes('youtube.com') && !lessonToDelete.videoUrl.includes('youtu.be'));
    if (isCloudinary && lessonToDelete.videoPublicId) {
      uploadService.deleteVideo(lessonToDelete.videoPublicId).catch(err => {
        console.error(`[Cloudinary Deletion Cleanup Error] ${err.message}`);
      });
    }

    return lesson;
  }

  async reorderLessons(courseId, orderedLessons, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    const instructorId = course.instructor && course.instructor._id 
      ? course.instructor._id.toString() 
      : course.instructor ? course.instructor.toString() : '';

    if (user.role !== 'admin' && instructorId !== user.id) {
      throw new AppError('Bạn không có quyền sửa khóa học này', 403);
    }

    // Bulk update orders & modules (hỗ trợ cả reorder trong module và move giữa các module)
    const bulkOps = orderedLessons.map((item) => {
      const updateFields = { order: item.order };
      if (item.moduleId || item.module) {
        updateFields.module = item.moduleId || item.module;
      }
      return {
        updateOne: {
          filter: { _id: item.id, course: courseId },
          update: updateFields
        }
      };
    });

    if (bulkOps.length > 0) {
      await lessonRepository.bulkWrite(bulkOps);
    }

    return { message: 'Cập nhật thứ tự bài giảng thành công' };
  }
}

module.exports = new LessonService();
