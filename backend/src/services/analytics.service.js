const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Result = require('../models/Result');
const Order = require('../models/Order');

class AnalyticsService {
  // ==================================================
  // ADMIN DASHBOARD
  // ==================================================
  async getAdminDashboard() {
    // Chạy song song tất cả aggregations đềEtối ưu thời gian
    const [
      overviewStats,
      revenueByMonth,
      topCourses,
      userGrowthByMonth,
      roleDistribution,
      recentEnrollments
    ] = await Promise.all([
      this._getAdminOverview(),
      this._getRevenueByMonth(),
      this._getTopCoursesByEnrollment(),
      this._getUserGrowthByMonth(),
      this._getUserRoleDistribution(),
      this._getRecentEnrollments()
    ]);

    return {
      overview: overviewStats,
      revenueByMonth,
      topCourses,
      userGrowthByMonth,
      roleDistribution,
      recentEnrollments
    };
  }

  async _getAdminOverview() {
    const [
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments(),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Enrollment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $lookup: { from: 'courses', localField: 'course', foreignField: '_id', as: 'course' } },
        { $unwind: '$course' },
        { $group: { _id: null, total: { $sum: '$course.price' } } }
      ])
    ]);

    return {
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue[0]?.total || 0
    };
  }

  async _getRevenueByMonth() {
    const currentYear = new Date().getFullYear();

    return await Enrollment.aggregate([
      {
        $match: {
          paymentStatus: 'completed',
          createdAt: { $gte: new Date(`${currentYear}-01-01`) }
        }
      },
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
        $group: {
          _id: { month: { $month: '$createdAt' } },
          revenue: { $sum: '$course.price' },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          revenue: 1,
          enrollments: 1
        }
      }
    ]);
  }

  async _getTopCoursesByEnrollment(limit = 5) {
    return await Enrollment.aggregate([
      {
        $group: {
          _id: '$course',
          enrollmentCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'courses',
          localField: '_id',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'users',
          localField: 'course.instructor',
          foreignField: '_id',
          as: 'instructor'
        }
      },
      { $unwind: '$instructor' },
      { $sort: { enrollmentCount: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          courseId: '$course._id',
          title: '$course.title',
          thumbnail: '$course.thumbnail',
          price: '$course.price',
          enrollmentCount: 1,
          instructorName: '$instructor.name'
        }
      }
    ]);
  }

  async _getUserGrowthByMonth() {
    const currentYear = new Date().getFullYear();

    return await User.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(`${currentYear}-01-01`) }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          newUsers: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          newUsers: 1
        }
      }
    ]);
  }

  async _getUserRoleDistribution() {
    return await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          role: '$_id',
          count: 1
        }
      }
    ]);
  }

  async _getRecentEnrollments(limit = 10) {
    return await Enrollment.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('student', 'name email avatar')
      .populate('course', 'title');
  }

  // ==================================================
  // TEACHER DASHBOARD
  // ==================================================
  async getTeacherDashboard(teacherId) {
    const [
      overview,
      courseStats,
      monthlyEnrollments,
      quizResults,
      dropOffAnalysis
    ] = await Promise.all([
      this._getTeacherOverview(teacherId),
      this._getTeacherCourseStats(teacherId),
      this._getTeacherMonthlyEnrollments(teacherId),
      this._getTeacherQuizStats(teacherId),
      this._getTeacherDropOffAnalysis(teacherId)
    ]);

    return {
      overview,
      courseStats,
      monthlyEnrollments,
      quizResults,
      dropOffAnalysis
    };
  }

  async _getTeacherOverview(teacherId) {
    // Tìm tất cả khóa học của giảng viên này
    const courses = await Course.find({ instructor: teacherId });
    const courseIds = courses.map(c => c._id);

    const [
      totalCourses,
      totalStudents,
      totalRevenue,
      completionCount
    ] = await Promise.all([
      Course.countDocuments({ instructor: teacherId }),
      Enrollment.countDocuments({ course: { $in: courseIds } }),
      Enrollment.aggregate([
        { $match: { course: { $in: courseIds }, paymentStatus: 'completed' } },
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        { $group: { _id: null, total: { $sum: '$course.price' } } }
      ]),
      Progress.countDocuments({ course: { $in: courseIds }, isCompleted: true })
    ]);

    return {
      totalCourses,
      totalStudents,
      totalRevenue: totalRevenue[0]?.total || 0,
      completionCount
    };
  }

  async _getTeacherCourseStats(teacherId) {
    return await Course.aggregate([
      { $match: { instructor: teacherId } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'course',
          as: 'enrollments'
        }
      },
      {
        $lookup: {
          from: 'progresses',
          localField: '_id',
          foreignField: 'course',
          as: 'progresses'
        }
      },
      {
        $project: {
          title: 1,
          status: 1,
          price: 1,
          thumbnail: 1,
          enrollmentCount: { $size: '$enrollments' },
          avgProgress: {
            $avg: '$progresses.progressPercentage'
          }
        }
      },
      { $sort: { enrollmentCount: -1 } }
    ]);
  }

  async _getTeacherMonthlyEnrollments(teacherId) {
    const courses = await Course.find({ instructor: teacherId }, '_id');
    const courseIds = courses.map(c => c._id);
    const currentYear = new Date().getFullYear();

    return await Enrollment.aggregate([
      {
        $match: {
          course: { $in: courseIds },
          createdAt: { $gte: new Date(`${currentYear}-01-01`) }
        }
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          enrollments: { $sum: 1 }
        }
      },
      { $sort: { '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          month: '$_id.month',
          enrollments: 1
        }
      }
    ]);
  }

  async _getTeacherQuizStats(teacherId) {
    return await Result.aggregate([
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
        $lookup: {
          from: 'courses',
          localField: 'quiz.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $match: { 'course.instructor': teacherId }
      },
      {
        $group: {
          _id: '$quiz._id',
          quizTitle: { $first: '$quiz.title' },
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: '$scorePercentage' },
          passCount: { $sum: { $cond: ['$isPassed', 1, 0] } }
        }
      },
      {
        $project: {
          _id: 0,
          quizTitle: 1,
          totalAttempts: 1,
          avgScore: { $round: ['$avgScore', 1] },
          passRate: {
            $round: [
              { $multiply: [{ $divide: ['$passCount', '$totalAttempts'] }, 100] },
              1
            ]
          }
        }
      }
    ]);
  }

  async _getTeacherDropOffAnalysis(teacherId) {
    const courses = await Course.find({ instructor: teacherId }, '_id');
    const courseIds = courses.map(c => c._id);

    return await Progress.aggregate([
      { $match: { course: { $in: courseIds } } },
      {
        $group: {
          _id: '$lastAccessedLesson',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          lessonId: '$_id',
          lessonTitle: { $ifNull: ['$lesson.title', 'Not Started'] },
          dropOffCount: '$count'
        }
      },
      { $sort: { dropOffCount: -1 } },
      { $limit: 10 }
    ]);
  }

  // ==================================================
  // FINANCIAL / ORDERS
  // ==================================================

  /**
   * Lấy danh sách orders có pagination, filter, và revenue summary
   * @param {Object} query - { page, limit, status }
   */
  async getOrderStats(query = {}) {
    const { page = 1, limit = 15, status } = query;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 15;
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status && ['pending', 'paid', 'failed'].includes(status)) {
      filter.status = status;
    }

    const [orders, total, revenueSummary] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('user', 'name email avatar')
        .populate('course', 'title price'),
      Order.countDocuments(filter),
      Order.aggregate([
        { $match: { status: 'paid' } },
        { $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$amount' }
        }}
      ])
    ]);

    const summary = revenueSummary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 };

    return {
      orders,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      summary: {
        totalRevenue: summary.totalRevenue,
        totalPaidOrders: summary.totalOrders,
        avgOrderValue: Math.round(summary.avgOrderValue || 0)
      }
    };
  }
}

module.exports = new AnalyticsService();
