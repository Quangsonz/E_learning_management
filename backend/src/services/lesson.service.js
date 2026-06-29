const lessonRepository = require('../repositories/lesson.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const enrollmentRepository = require('../repositories/enrollment.repository');

class LessonService {
  // Lấy toàn bộ bài giảng của một khóa học
  async getLessonsByCourse(courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    // Kiểm tra quyền truy cập (Admin và Giảng viên sở hữu khóa học luôn được phép)
    if (user.role === 'student') {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
      if (!enrollment || enrollment.paymentStatus !== 'completed') {
        throw new AppError('Bạn phải mua khóa học này để xem bài giảng', 403);
      }
    }

    const lessons = await lessonRepository.find({ course: courseId });
    return lessons.sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  async getLessonById(id, courseId, user) {
    const lesson = await lessonRepository.findOne({ _id: id, course: courseId });
    if (!lesson) {
      throw new AppError('Không tìm thấy bài giảng trong khóa học này', 404);
    }

    if (user.role === 'student') {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(user.id, courseId);
      if (!enrollment || enrollment.paymentStatus !== 'completed') {
        throw new AppError('Bạn phải mua khóa học này để xem bài giảng', 403);
      }
    }
    
    return lesson;
  }

  async createLesson(courseId, lessonData, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    // Chỉ Admin hoặc Giảng viên tạo khóa học mới được thêm bài giảng
    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền thêm bài giảng vào khóa học của người khác', 403);
    }

    lessonData.course = courseId;

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

    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền sửa bài giảng này', 403);
    }

    const lesson = await lessonRepository.findOneAndUpdate({ _id: id, course: courseId }, updateData, { new: true, runValidators: true });
    
    if (!lesson) throw new AppError('Không tìm thấy bài giảng', 404);
    return lesson;
  }

  async deleteLesson(id, courseId, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền xóa bài giảng này', 403);
    }

    const lesson = await lessonRepository.findOneAndDelete({ _id: id, course: courseId });
    if (!lesson) throw new AppError('Không tìm thấy bài giảng', 404);
    
    return lesson;
  }

  async reorderLessons(courseId, orderedLessons, user) {
    const course = await courseRepository.findById(courseId);
    if (!course) throw new AppError('Không tìm thấy khóa học', 404);

    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
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
