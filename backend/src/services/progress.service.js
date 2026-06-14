const progressRepository = require('../repositories/progress.repository');
const lessonRepository = require('../repositories/lesson.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');

class ProgressService {
  async markLessonComplete(courseId, lessonId, user) {
    // 1. Kiểm tra khóa học có tồn tại không
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    // 2. Tìm hoặc khởi tạo tiến trình học tập của user cho khóa học này
    let progress = await progressRepository.findByStudentAndCourse(user.id, courseId);
    if (!progress) {
      progress = await progressRepository.create({
        student: user.id,
        course: courseId,
        completedLessons: []
      });
    }

    // 3. Đánh dấu bài giảng hoàn thành (nếu chưa có trong mảng)
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
    }

    // 4. Tính toán phần trăm hoàn thành
    // Lấy tổng số lượng bài giảng thực tế có trong khóa học
    const allLessons = await lessonRepository.find({ course: courseId });
    const totalLessonsCount = allLessons.length;

    if (totalLessonsCount > 0) {
      progress.progressPercentage = Math.round((progress.completedLessons.length / totalLessonsCount) * 100);
    } else {
      progress.progressPercentage = 100;
    }

    // Cập nhật ngày học cuối cùng
    progress.lastAccessedLesson = lessonId;
    progress.isCompleted = progress.progressPercentage === 100;

    // Lưu lại bằng Mongoose save() để vượt qua các hook/validation
    await progress.save();

    return progress;
  }

  async getCourseProgress(courseId, user) {
    const progress = await progressRepository.findByStudentAndCourse(user.id, courseId);
    // Nếu học viên chưa xem bài nào, trả về tiến trình mặc định 0%
    if (!progress) {
      return {
        course: courseId,
        progressPercentage: 0,
        completedLessons: [],
        isCompleted: false
      };
    }
    return progress;
  }

  async getLearningStatistics(user) {
    // Lấy tất cả các khóa học và phần trăm tiến độ của user
    const stats = await progressRepository.findByStudent(user.id);
    
    // Tính toán thêm số lượng khóa học đã hoàn thành
    const completedCourses = stats.filter(p => p.progressPercentage === 100).length;
    const ongoingCourses = stats.length - completedCourses;

    return {
      totalEnrolled: stats.length,
      completedCourses,
      ongoingCourses,
      details: stats
    };
  }
}

module.exports = new ProgressService();
