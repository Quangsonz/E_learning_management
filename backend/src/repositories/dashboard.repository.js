const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Quiz = require('../models/Quiz');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const Course = require('../models/Course');

class DashboardRepository {
  /**
   * Lấy danh sách khóa học đang học của học viên, JOIN với tiến độ và bài học hiện tại.
   * Chỉ lấy các enrollment đã thanh toán thành công (paymentStatus: 'completed').
   */
  async getActiveCourses(studentId) {
    const objStudentId = new mongoose.Types.ObjectId(studentId);

    return await Enrollment.aggregate([
      // Bước 1: Lọc các khóa học đã đăng ký thành công của học viên
      {
        $match: {
          student: objStudentId,
          paymentStatus: 'completed'
        }
      },
      // Bước 2: JOIN với bảng Course để lấy thông tin khóa học
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseData'
        }
      },
      { $unwind: '$courseData' },
      // Bước 3: Chỉ lấy khóa học đã published
      { $match: { 'courseData.status': 'published' } },
      // Bước 4: JOIN với bảng Category để lấy tên danh mục
      {
        $lookup: {
          from: 'categories',
          localField: 'courseData.category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
      // Bước 5: JOIN với bảng Progress để lấy tiến độ học
      {
        $lookup: {
          from: 'progresses',
          let: { courseId: '$courseData._id', stuId: objStudentId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$course', '$$courseId'] },
                    { $eq: ['$student', '$$stuId'] }
                  ]
                }
              }
            }
          ],
          as: 'progressData'
        }
      },
      {
        $unwind: {
          path: '$progressData',
          preserveNullAndEmptyArrays: true
        }
      },
      // Bước 6: JOIN với bảng Lesson để lấy tiêu đề bài học cuối cùng đã truy cập
      {
        $lookup: {
          from: 'lessons',
          localField: 'progressData.lastAccessedLesson',
          foreignField: '_id',
          as: 'lastLessonData'
        }
      },
      {
        $unwind: {
          path: '$lastLessonData',
          preserveNullAndEmptyArrays: true
        }
      },
      // Bước 7: Loại bỏ các khóa đã hoàn thành 100% (không phải "đang học")
      {
        $match: {
          $or: [
            { 'progressData.isCompleted': false },
            { 'progressData.isCompleted': { $exists: false } }
          ]
        }
      },
      // Bước 8: Format output
      {
        $project: {
          _id: 0,
          courseId: '$courseData._id',
          title: '$courseData.title',
          category: { $ifNull: ['$categoryData.name', 'Chưa phân loại'] },
          progress: { $ifNull: ['$progressData.progressPercentage', 0] },
          lesson: { $ifNull: ['$lastLessonData.title', 'Chưa bắt đầu'] },
          thumbnailUrl: '$courseData.thumbnailUrl',
          enrolledAt: '$enrolledAt'
        }
      },
      // Sắp xếp theo hoạt động gần nhất
      { $sort: { 'progressData.lastStudiedAt': -1 } }
    ]);
  }

  /**
   * Lấy danh sách quiz sắp tới của học viên (chưa làm, còn hạn).
   * JOIN: Enrollment → Course → Quiz, lọc quiz chưa có Result.
   */
  async getUpcomingQuizzes(studentId) {
    const objStudentId = new mongoose.Types.ObjectId(studentId);
    const now = new Date();

    // Bước 1: Lấy danh sách courseId mà học viên đã enrolled
    const enrolledCourseIds = await Enrollment.find(
      { student: objStudentId, paymentStatus: 'completed' },
      'course'
    ).lean();
    const courseIds = enrolledCourseIds.map(e => e.course);

    // Bước 2: Tìm các quiz trong các khóa đó, còn hạn hoặc sắp diễn ra
    const upcomingQuizzes = await Quiz.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          $or: [
            { dueDate: { $gte: now } },   // Có ngày hạn và chưa hết hạn
            { dueDate: null }              // Quiz không có ngày hạn (luôn open)
          ]
        }
      },
      // Lọc quiz mà học viên CHƯA làm
      {
        $lookup: {
          from: 'results',
          let: { quizId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$quiz', '$$quizId'] },
                    { $eq: ['$student', objStudentId] }
                  ]
                }
              }
            }
          ],
          as: 'myResults'
        }
      },
      { $match: { myResults: { $size: 0 } } }, // Chỉ lấy quiz chưa làm
      // JOIN Course để lấy tên khóa học làm subtitle
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo'
        }
      },
      { $unwind: '$courseInfo' },
      {
        $project: {
          _id: 0,
          quizId: '$_id',
          title: 1,
          subtitle: '$courseInfo.title',
          scheduledAt: 1,
          dueDate: 1,
          timeLimit: 1,
          passingScore: 1
        }
      },
      { $sort: { scheduledAt: 1, dueDate: 1 } },
      { $limit: 5 }
    ]);

    return upcomingQuizzes;
  }

  /**
   * Lấy các hoạt động gần đây của học viên từ 2 nguồn:
   * - Progress.lastStudiedAt (xem bài học)
   * - Result (hoàn thành quiz)
   * Gộp và sắp xếp theo thời gian mới nhất.
   */
  async getRecentActivities(studentId) {
    const objStudentId = new mongoose.Types.ObjectId(studentId);

    // Nguồn 1: Hoạt động xem bài học từ Progress
    const lessonActivities = await Progress.aggregate([
      { $match: { student: objStudentId, lastStudiedAt: { $ne: null } } },
      {
        $lookup: {
          from: 'lessons',
          localField: 'lastAccessedLesson',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          type: { $literal: 'lesson' },
          title: { $literal: 'Xem bài học' },
          detail: { $ifNull: ['$lesson.title', '$course.title'] },
          time: '$lastStudiedAt',
          progressPercentage: 1
        }
      }
    ]);

    // Nguồn 2: Hoạt động làm quiz từ Result
    const quizActivities = await Result.aggregate([
      { $match: { student: objStudentId } },
      {
        $lookup: {
          from: 'quizzes',
          localField: 'quiz',
          foreignField: '_id',
          as: 'quiz'
        }
      },
      { $unwind: '$quiz' },
      {
        $project: {
          type: { $literal: 'quiz' },
          title: {
            $cond: {
              if: '$isPassed',
              then: 'Hoàn thành Quiz',
              else: 'Làm Quiz (Chưa đạt)'
            }
          },
          detail: '$quiz.title',
          time: '$createdAt',
          scorePercentage: 1,
          isPassed: 1
        }
      }
    ]);

    // Gộp 2 mảng, sắp xếp theo thời gian mới nhất, lấy 10 mục
    const combined = [...lessonActivities, ...quizActivities]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    return combined;
  }

  /**
   * Tổng hợp thống kê dashboard cho học viên.
   * Tính: averageScore từ Result, activeCourses từ Progress, totalFocusMinutes từ Lesson.
   */
  async getStatsAggregation(studentId) {
    const objStudentId = new mongoose.Types.ObjectId(studentId);

    // Tổng hợp từ bảng Result: điểm trung bình
    const scoreStats = await Result.aggregate([
      { $match: { student: objStudentId } },
      {
        $group: {
          _id: null,
          averageScore: { $avg: '$scorePercentage' },
          totalQuizzes: { $sum: 1 },
          passedQuizzes: { $sum: { $cond: ['$isPassed', 1, 0] } }
        }
      }
    ]);

    // Tổng số khóa đang học (progress chưa hoàn thành)
    const activeCoursesCount = await Progress.countDocuments({
      student: objStudentId,
      isCompleted: false,
      progressPercentage: { $gt: 0 }
    });

    // Tổng thời gian học (tính từ các lesson đã hoàn thành)
    const focusTimeData = await Progress.aggregate([
      { $match: { student: objStudentId } },
      {
        $lookup: {
          from: 'lessons',
          localField: 'completedLessons',
          foreignField: '_id',
          as: 'completedLessonDetails'
        }
      },
      {
        $project: {
          totalDuration: { $sum: '$completedLessonDetails.duration' }
        }
      },
      {
        $group: {
          _id: null,
          totalSeconds: { $sum: '$totalDuration' }
        }
      }
    ]);

    // Tổng tiến độ học tập trung bình (learningRing)
    const progressAvg = await Progress.aggregate([
      { $match: { student: objStudentId } },
      {
        $group: {
          _id: null,
          avgProgress: { $avg: '$progressPercentage' },
          totalCourses: { $sum: 1 }
        }
      }
    ]);

    return {
      scoreStats: scoreStats[0] || { averageScore: 0, totalQuizzes: 0, passedQuizzes: 0 },
      activeCoursesCount,
      focusTimeData: focusTimeData[0] || { totalSeconds: 0 },
      progressAvg: progressAvg[0] || { avgProgress: 0, totalCourses: 0 }
    };
  }

  /**
   * Lấy danh sách khóa học được đề xuất: đã published, học viên CHƯA enrolled.
   * Ưu tiên theo preferences, fallback sang rating cao nhất.
   */
  async getRecommendedCourses(studentId, preferences = []) {
    const objStudentId = new mongoose.Types.ObjectId(studentId);

    // Lấy danh sách courseId đã enrolled để loại trừ
    const enrolled = await Enrollment.find(
      { student: objStudentId },
      'course'
    ).lean();
    const enrolledIds = enrolled.map(e => e.course);

    const matchStage = {
      status: 'published',
      _id: { $nin: enrolledIds }
    };

    // Nếu có preferences, ưu tiên theo danh mục yêu thích
    if (preferences && preferences.length > 0) {
      matchStage.category = { $in: preferences };
    }

    const courses = await Course.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'categoryData'
        }
      },
      { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
      // Đếm số học viên enrolled để tính "students count"
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $project: {
          _id: 0,
          courseId: '$_id',
          title: 1,
          category: { $ifNull: ['$categoryData.name', 'Chưa phân loại'] },
          rating: '$averageRating',
          enrolledCount: { $size: '$enrollments' },
          thumbnailUrl: 1,
          price: 1
        }
      },
      { $sort: { rating: -1, enrolledCount: -1 } },
      { $limit: 6 }
    ]);

    // Nếu preferences có nhưng không đủ 6 kết quả, bổ sung thêm từ các danh mục khác
    if (preferences && preferences.length > 0 && courses.length < 6) {
      const needed = 6 - courses.length;
      const existingIds = courses.map(c => c.courseId);
      const fallback = await Course.aggregate([
        {
          $match: {
            status: 'published',
            _id: { $nin: [...enrolledIds, ...existingIds] },
            category: { $nin: preferences }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryData'
          }
        },
        { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'enrollments',
            localField: '_id',
            foreignField: 'course',
            as: 'enrollments'
          }
        },
        {
          $project: {
            _id: 0,
            courseId: '$_id',
            title: 1,
            category: { $ifNull: ['$categoryData.name', 'Chưa phân loại'] },
            rating: '$averageRating',
            enrolledCount: { $size: '$enrollments' },
            thumbnailUrl: 1,
            price: 1
          }
        },
        { $sort: { rating: -1 } },
        { $limit: needed }
      ]);
      courses.push(...fallback);
    }

    return courses;
  }

  /**
   * Lấy thông báo mới nhất của học viên từ bảng Notification.
   */
  async getAnnouncements(studentId, limit = 5) {
    const objStudentId = new mongoose.Types.ObjectId(studentId);

    return await Notification.aggregate([
      { $match: { recipient: objStudentId } },
      // JOIN với User để lấy tên người gửi (nếu cần xác định sender)
      // Hiện tại Notification không có sender, dùng type để xác định
      {
        $project: {
          _id: 0,
          notificationId: '$_id',
          title: '$message',          // message ngắn gọn làm title
          sender: {
            $switch: {
              branches: [
                { case: { $eq: ['$type', 'system'] }, then: 'Hệ thống' },
                { case: { $eq: ['$type', 'course'] }, then: 'Giảng viên' },
                { case: { $eq: ['$type', 'payment'] }, then: 'Thanh toán' },
                { case: { $eq: ['$type', 'certificate'] }, then: 'Chứng chỉ' }
              ],
              default: 'Hệ thống'
            }
          },
          time: '$createdAt',
          isNew: { $eq: ['$isRead', false] },
          type: 1,
          link: 1
        }
      },
      { $sort: { time: -1 } },
      { $limit: limit }
    ]);
  }
}

module.exports = new DashboardRepository();
