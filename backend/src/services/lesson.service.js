const lessonRepository = require('../repositories/lesson.repository');
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
      console.error('Lỗi khi kiểm tra phân quyền bài giảng:', e);
    }

    const lessons = await lessonRepository.findByCourseId(courseId);

    if (!hasFullAccess) {
      // Chỉ trả về curriculum, giấu videoUrl
      return lessons.map(lesson => {
        const doc = { ...lesson };
        delete doc.videoUrl;
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
      delete doc.videoUrl;
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

    // Tự động phát hiện provider nếu chưa có
    const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(lessonData.videoUrl || '');
    if (!lessonData.provider) {
      lessonData.provider = isYouTube ? 'youtube' : 'cloudinary';
    }
    if (isYouTube) {
      lessonData.videoPublicId = null;
    }

    // Tự động gán order nếu không truyền (lấy số bài giảng hiện có + 1)
    if (!lessonData.order) {
      const lessons = await lessonRepository.find({ course: courseId });
      lessonData.order = lessons.length + 1;
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

    // Tự động phát hiện provider nếu URL thay đổi
    if (updateData.videoUrl && !updateData.provider) {
      const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i.test(updateData.videoUrl);
      updateData.provider = isYouTube ? 'youtube' : 'cloudinary';
      if (isYouTube) {
        updateData.videoPublicId = null;
      }
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

    // Bulk update orders
    // We expect orderedLessons to be an array of { id, order }
    const bulkOps = orderedLessons.map((item) => ({
      updateOne: {
        filter: { _id: item.id, course: courseId },
        update: { order: item.order }
      }
    }));

    if (bulkOps.length > 0) {
      await lessonRepository.bulkWrite(bulkOps);
    }

    return { message: 'Cập nhật thứ tự bài giảng thành công' };
  }
}

module.exports = new LessonService();
