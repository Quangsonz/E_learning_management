const progressRepository = require('../repositories/progress.repository');
const lessonRepository = require('../repositories/lesson.repository');
const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const xpService = require('./xp.service');

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
    let newlyCompleted = false;
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      newlyCompleted = true;
      
      // Award XP
      await xpService.addXP(user.id, 'LESSON_COMPLETE');
      // Check first lesson badge
      if (progress.completedLessons.length === 1) {
        await xpService.awardBadge(user.id, 'FIRST_LESSON');
      }

      // Restore Study History logic
      const userRepository = require('../repositories/user.repository');
      const student = await userRepository.findById(user.id);
      if (student) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        let todayRecord = student.studyHistory?.find(h => h.date === today);
        if (!todayRecord) {
          student.studyHistory = student.studyHistory || [];
          student.studyHistory.push({ date: today, focusMinutes: 0, lessonsCompleted: 1 });
          
          // Tính streak
          const yesterdayRecord = student.studyHistory.find(h => h.date === yesterday);
          if (yesterdayRecord) {
            student.studyStreakDays = (student.studyStreakDays || 0) + 1;
          } else if (student.studyStreakDays === 0) {
            student.studyStreakDays = 1;
          }
        } else {
          todayRecord.lessonsCompleted += 1;
        }

        await student.save({ validateBeforeSave: false });
      }
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

  async updateVideoProgress(courseId, lessonId, userId, time) {
    let progress = await progressRepository.findByStudentAndCourse(userId, courseId);
    if (!progress) {
      progress = await progressRepository.create({
        student: userId,
        course: courseId,
        completedLessons: []
      });
    }

    if (!progress.videoProgress) {
      progress.videoProgress = new Map();
    }
    progress.videoProgress.set(lessonId, time);
    await progress.save();
    return progress;
  }

  async addBookmark(courseId, lessonId, userId, time, note) {
    let progress = await progressRepository.findByStudentAndCourse(userId, courseId);
    if (!progress) {
      progress = await progressRepository.create({
        student: userId,
        course: courseId,
        completedLessons: []
      });
    }

    if (!progress.bookmarks) {
      progress.bookmarks = [];
    }
    progress.bookmarks.push({ lesson: lessonId, time, note });
    await progress.save();
    return progress;
  }
}

module.exports = new ProgressService();
