const dashboardRepository = require('../repositories/dashboard.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');

/**
 * Hàm tiện ích: Format khoảng thời gian tương đối (giống "12 min ago", "2 hours ago").
 * Dùng cho recent-activities và announcements.
 */
const formatRelativeTime = (date) => {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return `${diffSec} giây trước`;
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffHrs < 24) return `${diffHrs} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;

  // Nếu > 7 ngày, hiển thị ngày cụ thể
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Hàm tiện ích: Format thời gian quiz sắp tới.
 * Trả về chuỗi thân thiện: "Tomorrow, 8:30 AM", "Thứ 2, 09:00 AM", hoặc ngày cụ thể.
 */
const formatUpcomingTime = (date) => {
  if (!date) return 'Không giới hạn';

  const now = new Date();
  const target = new Date(date);
  const diffMs = target - now;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHrs / 24);

  const timeStr = target.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays === 0) return `Hôm nay, ${timeStr}`;
  if (diffDays === 1) return `Tomorrow, ${timeStr}`;
  if (diffDays < 7) {
    const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${dayNames[target.getDay()]}, ${timeStr}`;
  }

  return `${target.toLocaleDateString('vi-VN')}, ${timeStr}`;
};

/**
 * Hàm tiện ích: Format số học viên thân thiện ("1.2k", "23.5k").
 */
const formatStudentCount = (count) => {
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
};

class DashboardService {
  /**
   * API 1: Tổng quan & Thống kê
   * Tính toán: learningRing, studyStreak, averageScore, focusTime, activeCourses, heroStats.
   */
  async getDashboardStats(studentId) {
    // Lấy thông tin user (streak, totalFocusMinutes)
    const user = await userRepository.findById(studentId);
    if (!user) throw new AppError('Không tìm thấy học viên', 404);

    // Lấy aggregation stats từ repository
    const { scoreStats, activeCoursesCount, focusTimeData, progressAvg } =
      await dashboardRepository.getStatsAggregation(studentId);

    // Tính focusTime: ưu tiên totalFocusMinutes đã lưu, fallback tính từ lesson duration
    const focusTimeHours = user.totalFocusMinutes > 0
      ? parseFloat((user.totalFocusMinutes / 60).toFixed(1))
      : parseFloat((focusTimeData.totalSeconds / 3600).toFixed(1));

    // LearningRing: tiến độ học tập trung bình tổng thể (%)
    const learningRing = Math.round(progressAvg.avgProgress || 0);

    // AverageScore: điểm trung bình qua các quiz (%)
    const averageScore = Math.round(scoreStats.averageScore || 0);

    return {
      studentName: user.name,
      learningRing,
      stats: {
        studyStreak: user.studyStreakDays || 0,      // Số ngày học liên tiếp
        averageScore,                                 // % điểm trung bình quiz
        focusTime: focusTimeHours,                    // Tổng giờ học
        activeCourses: activeCoursesCount            // Số khóa đang học
      },
      heroStats: {
        focusBoostPercent: Math.min(Math.round((focusTimeHours / 10) * 100), 100), // % so với mục tiêu 10h
        quizAvgScore: averageScore,
        totalQuizzesCompleted: scoreStats.totalQuizzes || 0,
        passRate: scoreStats.totalQuizzes > 0
          ? Math.round((scoreStats.passedQuizzes / scoreStats.totalQuizzes) * 100)
          : 0
      }
    };
  }

  /**
   * API 2: Danh sách khóa học đang học
   * Shape: [{ title, category, progress, lesson }]
   */
  async getActiveCourses(studentId) {
    const courses = await dashboardRepository.getActiveCourses(studentId);

    return courses.map(c => ({
      courseId: c.courseId,
      title: c.title,
      category: c.category,
      progress: c.progress,
      lesson: c.lesson,
      thumbnailUrl: c.thumbnailUrl || null
    }));
  }

  /**
   * API 3: Bài kiểm tra sắp tới
   * Shape: [{ title, subtitle, time }]
   */
  async getUpcomingQuizzes(studentId) {
    const quizzes = await dashboardRepository.getUpcomingQuizzes(studentId);

    return quizzes.map(q => ({
      quizId: q.quizId,
      title: q.title,
      subtitle: q.subtitle,                           // Tên khóa học (dùng làm subtitle)
      time: formatUpcomingTime(q.scheduledAt || q.dueDate),
      timeLimit: q.timeLimit ? `${q.timeLimit} phút` : 'Không giới hạn',
      passingScore: q.passingScore
    }));
  }

  /**
   * API 4: Hoạt động gần đây
   * Shape: [{ title, detail, time }]
   */
  async getRecentActivities(studentId) {
    const activities = await dashboardRepository.getRecentActivities(studentId);

    return activities.map(a => ({
      type: a.type,
      title: a.title,
      detail: a.detail,
      time: formatRelativeTime(a.time),
      ...(a.type === 'quiz' && {
        isPassed: a.isPassed,
        score: a.scorePercentage ? `${Math.round(a.scorePercentage)}%` : null
      }),
      ...(a.type === 'lesson' && {
        progress: a.progressPercentage ? `${a.progressPercentage}%` : null
      })
    }));
  }

  /**
   * API 5: Khóa học đề xuất
   * Shape: [{ title, category, rating, students }]
   */
  async getRecommendedCourses(studentId) {
    const user = await userRepository.findById(studentId);
    const preferences = user?.preferences || [];

    const courses = await dashboardRepository.getRecommendedCourses(studentId, preferences);

    return courses.map(c => ({
      courseId: c.courseId,
      title: c.title,
      category: c.category,
      rating: parseFloat((c.rating || 0).toFixed(1)),
      students: formatStudentCount(c.enrolledCount || 0),
      thumbnailUrl: c.thumbnailUrl || null,
      price: c.price || 0
    }));
  }

  /**
   * API 6: Thông báo mới
   * Shape: [{ title, sender, time, isNew }]
   */
  async getAnnouncements(studentId) {
    const notifications = await dashboardRepository.getAnnouncements(studentId, 5);

    return notifications.map(n => ({
      notificationId: n.notificationId,
      title: n.title,
      sender: n.sender,
      time: formatRelativeTime(n.time),
      isNew: n.isNew,
      type: n.type,
      link: n.link || null
    }));
  }

  /**
   * API TỔNG HỢP: Dashboard Summary
   * Gọi song song tất cả 6 service method bằng Promise.all().
   * Tổng thời gian = max(thời gian request chậm nhất), không cộng dồn.
   * Nếu 1 API con lỗi, trả về null cho field đó, không crash toàn bộ response.
   */
  async getDashboardSummary(studentId) {
    const safeCall = async (fn, fallback = null) => {
      try {
        return await fn();
      } catch (err) {
        console.error(`[Dashboard Summary] Lỗi khi gọi: ${fn.name}`, err.message);
        return fallback;
      }
    };

    // Gọi song song 6 service methods
    const [stats, activeCourses, upcomingQuizzes, recentActivities, recommendedCourses, announcements] =
      await Promise.all([
        safeCall(() => this.getDashboardStats(studentId)),
        safeCall(() => this.getActiveCourses(studentId), []),
        safeCall(() => this.getUpcomingQuizzes(studentId), []),
        safeCall(() => this.getRecentActivities(studentId), []),
        safeCall(() => this.getRecommendedCourses(studentId), []),
        safeCall(() => this.getAnnouncements(studentId), [])
      ]);

    return {
      stats,
      activeCourses,
      upcomingQuizzes,
      recentActivities,
      recommendedCourses,
      announcements
    };
  }
}

module.exports = new DashboardService();
