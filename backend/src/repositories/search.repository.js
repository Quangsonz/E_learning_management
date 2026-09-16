const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const TeacherApplication = require('../models/TeacherApplication');
const Enrollment = require('../models/Enrollment');
const { escapeRegex, buildVietnameseRegex, buildLocalizedSearchConditions } = require('../utils/searchHelper');

class SearchRepository {
  /**
   * Search courses with role-appropriate filters and lean projection
   */
  async searchCourses(searchTerm, user = null, limit = 6) {
    const searchConditions = buildLocalizedSearchConditions('title', searchTerm);
    const slugRegex = new RegExp(escapeRegex(searchTerm.trim().toLowerCase()), 'i');
    searchConditions.push({ slug: slugRegex });

    let roleFilter = {};
    if (!user || user.role === 'student') {
      roleFilter.status = 'published';
    } else if (user.role === 'teacher') {
      roleFilter.$or = [
        { instructor: user._id || user.id },
        { status: 'published' }
      ];
    } // Admin has no status restriction

    const query = {
      $and: [
        { $or: searchConditions },
        roleFilter
      ]
    };

    return await Course.find(query)
      .select('_id title slug thumbnailUrl price estimatedPrice discountPercentage averageRating status instructor category')
      .populate('instructor', 'name avatar')
      .populate('category', 'name slug')
      .limit(limit)
      .lean();
  }

  /**
   * Search lessons belonging to accessible courses
   */
  async searchLessons(searchTerm, user = null, limit = 5) {
    const searchConditions = buildLocalizedSearchConditions('title', searchTerm);

    // Determine accessible course IDs
    let courseFilter = {};
    if (!user || user.role === 'student') {
      // Find published courses or student's enrolled courses
      const publishedCourses = await Course.find({ status: 'published' }).select('_id').lean();
      let accessibleCourseIds = publishedCourses.map(c => c._id);

      if (user && (user._id || user.id)) {
        const enrolled = await Enrollment.find({
          student: user._id || user.id,
          paymentStatus: 'completed'
        }).select('course').lean();
        const enrolledCourseIds = enrolled.map(e => e.course);
        accessibleCourseIds = [...accessibleCourseIds, ...enrolledCourseIds];
      }
      courseFilter = { course: { $in: accessibleCourseIds } };
    } else if (user.role === 'teacher') {
      const teacherCourses = await Course.find({
        $or: [
          { instructor: user._id || user.id },
          { status: 'published' }
        ]
      }).select('_id').lean();
      courseFilter = { course: { $in: teacherCourses.map(c => c._id) } };
    }

    const query = {
      $and: [
        { $or: searchConditions },
        courseFilter
      ]
    };

    return await Lesson.find(query)
      .select('_id title duration order course provider')
      .populate('course', 'title slug status')
      .limit(limit)
      .lean();
  }

  /**
   * Search categories
   */
  async searchCategories(searchTerm, limit = 5) {
    const searchConditions = buildLocalizedSearchConditions('name', searchTerm);
    const slugRegex = new RegExp(escapeRegex(searchTerm.trim().toLowerCase()), 'i');
    searchConditions.push({ slug: slugRegex });

    return await Category.find({ $or: searchConditions })
      .select('_id name slug description')
      .limit(limit)
      .lean();
  }

  /**
   * Search instructors/teachers for public and students (sanitized projection)
   */
  async searchInstructors(searchTerm, limit = 5) {
    const nameRegex = buildVietnameseRegex(searchTerm);
    return await User.find({
      role: 'teacher',
      isActive: true,
      name: nameRegex
    })
      .select('_id name avatar role')
      .limit(limit)
      .lean();
  }

  /**
   * Search users for Admin (or Teacher managing enrolled students)
   */
  async searchUsers(searchTerm, user, limit = 6) {
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      return [];
    }

    const nameRegex = buildVietnameseRegex(searchTerm);
    const emailRegex = new RegExp(escapeRegex(searchTerm.trim()), 'i');

    if (user.role === 'teacher') {
      // Teacher can only search students in their own courses or other teachers
      const myCourses = await Course.find({ instructor: user._id || user.id }).select('_id').lean();
      const courseIds = myCourses.map(c => c._id);
      const enrollments = await Enrollment.find({ course: { $in: courseIds } }).select('student').lean();
      const studentIds = enrollments.map(e => e.student);

      return await User.find({
        $and: [
          {
            $or: [
              { _id: { $in: studentIds } },
              { role: 'teacher' }
            ]
          },
          {
            $or: [
              { name: nameRegex },
              { email: emailRegex }
            ]
          }
        ]
      })
        .select('_id name email avatar role')
        .limit(limit)
        .lean();
    }

    // Admin can search all users
    return await User.find({
      $or: [
        { name: nameRegex },
        { email: emailRegex }
      ]
    })
      .select('_id name email avatar role isActive createdAt')
      .limit(limit)
      .lean();
  }

  /**
   * Search orders (Admin only)
   */
  async searchOrders(searchTerm, user, limit = 5) {
    if (!user || user.role !== 'admin') {
      return [];
    }

    const cleanTerm = searchTerm.trim();
    const idRegex = new RegExp(escapeRegex(cleanTerm), 'i');

    // First find matching users or courses
    const [matchingUsers, matchingCourses] = await Promise.all([
      User.find({
        $or: [
          { name: buildVietnameseRegex(cleanTerm) },
          { email: idRegex }
        ]
      }).select('_id').limit(10).lean(),
      Course.find({
        $or: buildLocalizedSearchConditions('title', cleanTerm)
      }).select('_id').limit(10).lean()
    ]);

    const userIds = matchingUsers.map(u => u._id);
    const courseIds = matchingCourses.map(c => c._id);

    const orClauses = [
      { stripePaymentIntentId: idRegex }
    ];

    if (userIds.length > 0) {
      orClauses.push({ user: { $in: userIds } });
    }
    if (courseIds.length > 0) {
      orClauses.push({ course: { $in: courseIds } });
    }

    return await Order.find({ $or: orClauses })
      .select('_id amount currency status createdAt stripePaymentIntentId user course')
      .populate('user', 'name email')
      .populate('course', 'title slug')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Search teacher applications (Admin only)
   */
  async searchTeacherApplications(searchTerm, user, limit = 5) {
    if (!user || user.role !== 'admin') {
      return [];
    }

    const cleanTerm = searchTerm.trim();
    const regex = buildVietnameseRegex(cleanTerm);

    const matchingStudents = await User.find({
      $or: [
        { name: regex },
        { email: new RegExp(escapeRegex(cleanTerm), 'i') }
      ]
    }).select('_id').limit(10).lean();

    const studentIds = matchingStudents.map(s => s._id);

    const orClauses = [
      { specialty: regex },
      { bio: regex }
    ];

    if (studentIds.length > 0) {
      orClauses.push({ student: { $in: studentIds } });
    }

    return await TeacherApplication.find({ $or: orClauses })
      .select('_id student specialty status createdAt adminNotes')
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = new SearchRepository();
