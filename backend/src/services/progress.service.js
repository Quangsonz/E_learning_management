const progressRepository = require('../repositories/progress.repository');
const lessonRepository = require('../repositories/lesson.repository');
const courseRepository = require('../repositories/course.repository');
const enrollmentRepository = require('../repositories/enrollment.repository');
const AppError = require('../utils/appError');
const xpService = require('./xp.service');

class ProgressService {
  async markLessonComplete(courseId, lessonId, user) {
    const studentId = typeof user === 'string' ? user : (user?.id || user?._id || '').toString();
    if (!studentId) throw new AppError('Xác thực học viên không hợp lệ', 401);

    // 1. Kiểm tra khóa học có tồn tại không
    const course = await courseRepository.findById(courseId);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học', 404);
    }

    // 2. Kiểm tra xem học viên có đăng ký khóa học hay không (trừ admin/giảng viên)
    const isTeacherOrAdmin = user?.role === 'admin' || user?.role === 'teacher';
    if (!isTeacherOrAdmin) {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
      if (!enrollment || enrollment.paymentStatus !== 'completed') {
        throw new AppError('Bạn chưa đăng ký khóa học này', 403);
      }
    }

    // 3. Tìm hoặc khởi tạo tiến trình học tập của user cho khóa học này
    let progress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (!progress) {
      progress = await progressRepository.create({
        student: studentId,
        course: courseId,
        completedLessons: []
      });
    }

    // 4. Đánh dấu bài giảng hoàn thành (nếu chưa có trong mảng)
    let newlyCompleted = false;
    if (!progress.completedLessons.includes(lessonId)) {
      progress.completedLessons.push(lessonId);
      newlyCompleted = true;
      
      // Award XP
      await xpService.addXP(studentId, 'LESSON_COMPLETE');
      // Check first lesson badge
      if (progress.completedLessons.length === 1) {
        await xpService.awardBadge(studentId, 'FIRST_LESSON');
      }

      // Restore Study History logic
      const userRepository = require('../repositories/user.repository');
      const student = await userRepository.findById(studentId);
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

    // 5. Tính toán phần trăm hoàn thành
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

    await progress.save();

    return progress;
  }

  async getCourseProgress(courseId, user) {
    const studentId = typeof user === 'string' ? user : (user?.id || user?._id || '').toString();
    if (!studentId) {
      return {
        course: courseId,
        progressPercentage: 0,
        completedLessons: [],
        isCompleted: false
      };
    }

    const progress = await progressRepository.findByStudentAndCourse(studentId, courseId);
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
    const studentId = typeof user === 'string' ? user : (user?.id || user?._id || '').toString();
    if (!studentId) {
      return {
        totalEnrolled: 0,
        completedCourses: 0,
        ongoingCourses: 0,
        details: []
      };
    }

    // 1. Lấy danh sách khóa học mà học viên thực sự đã đăng ký
    const enrollments = await enrollmentRepository.findByStudent(studentId);
    const enrolledCourseIds = new Set(
      enrollments
        .filter(e => e.paymentStatus === 'completed' && e.course)
        .map(e => (e.course._id || e.course).toString())
    );

    if (enrolledCourseIds.size === 0) {
      return {
        totalEnrolled: 0,
        completedCourses: 0,
        ongoingCourses: 0,
        details: []
      };
    }

    // 2. Lấy tiến độ học tập và chỉ giữ lại tiến độ của những khóa học đã đăng ký
    const stats = await progressRepository.findByStudent(studentId);
    const validStats = stats.filter(p => p.course && enrolledCourseIds.has((p.course._id || p.course).toString()));

    const completedCourses = validStats.filter(p => p.progressPercentage === 100).length;
    const ongoingCourses = validStats.length - completedCourses;

    return {
      totalEnrolled: enrolledCourseIds.size,
      completedCourses,
      ongoingCourses,
      details: validStats
    };
  }

  async updateVideoProgress(courseId, lessonId, userId, time) {
    const studentId = typeof userId === 'string' ? userId : (userId?.id || userId?._id || '').toString();
    if (!studentId) throw new AppError('Xác thực học viên không hợp lệ', 401);

    const key = `videoProgress.${lessonId}`;
    const progress = await progressRepository.model.findOneAndUpdate(
      { student: studentId, course: courseId },
      { 
        $set: { 
          [key]: time,
          lastAccessedLesson: lessonId 
        } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('videoProgress lastAccessedLesson progressPercentage isCompleted').lean();

    return progress;
  }

  async addBookmark(courseId, lessonId, userId, time, note) {
    const studentId = typeof userId === 'string' ? userId : (userId?.id || userId?._id || '').toString();
    if (!studentId) throw new AppError('Xác thực học viên không hợp lệ', 401);

    let progress = await progressRepository.findByStudentAndCourse(studentId, courseId);
    if (!progress) {
      const enrollment = await enrollmentRepository.findByStudentAndCourse(studentId, courseId);
      if (!enrollment || enrollment.paymentStatus !== 'completed') {
        throw new AppError('Bạn chưa đăng ký khóa học này', 403);
      }

      progress = await progressRepository.create({
        student: studentId,
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
