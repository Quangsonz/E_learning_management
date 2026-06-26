const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const slugify = require('slugify');

class CourseService {
  async getAllCourses(query, user) {
    let filter = {};

    // Search theo từ khóa
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Lọc theo danh mục
    if (query.category && query.category !== 'All') {
      // Có thể là ID hoặc slug, nhưng trên frontend ta truyền ID sẽ tốt hơn. Nếu truyền string thì filter.
      filter.category = query.category;
    }

    // Lọc theo người tạo (giáo viên xem khóa học của mình)
    if (query.instructor) {
      filter.instructor = query.instructor;
    }

    if (query.status) {
      filter.status = query.status;
    }

    // Nếu không đăng nhập hoặc là học viên, chỉ xem được các khóa học đã published
    if (!user || user.role === 'student') {
      filter.status = 'published';
    }

    // Pagination
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Sort
    const sort = query.sort || '-createdAt';

    const { total, data } = await courseRepository.findPaginated(filter, skip, limit, sort);

    return {
      courses: data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getCourseById(id) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }
    return course;
  }

  async createCourse(courseData, user) {
    if (!courseData.slug) {
      courseData.slug = slugify(courseData.title, { lower: true, strict: true });
    }

    const existingCourse = await courseRepository.findBySlug(courseData.slug);
    if (existingCourse) {
      throw new AppError('Tiêu đề khóa học này đã tồn tại, vui lòng chọn tiêu đề khác', 400);
    }

    // Gắn ID của người tạo vào làm Instructor nếu không phải là admin truyền ID khác
    if (user.role === 'admin' && courseData.instructor) {
      // Do nothing, keep courseData.instructor as provided
    } else {
      courseData.instructor = user.id;
    }

    return await courseRepository.create(courseData);
  }

  async updateCourse(id, updateData, user) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    // Kiểm tra quyền: Chỉ Admin (manage_all) hoặc chính Teacher tạo ra khóa học mới được sửa
    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền chỉnh sửa khóa học của người khác', 403);
    }

    if (user.role !== 'admin') {
      delete updateData.instructor; // Non-admins cannot change the instructor
    }

    if (updateData.title && !updateData.slug) {
      updateData.slug = slugify(updateData.title, { lower: true, strict: true });
    }

    return await courseRepository.updateById(id, updateData);
  }

  async deleteCourse(id, user) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    // Kiểm tra quyền: Chỉ Admin hoặc chính Teacher tạo ra khóa học mới được xóa
    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền xóa khóa học của người khác', 403);
    }

    return await courseRepository.deleteById(id);
  }
}

module.exports = new CourseService();
