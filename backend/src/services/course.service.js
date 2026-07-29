const courseRepository = require('../repositories/course.repository');
const AppError = require('../utils/appError');
const slugify = require('slugify');
const mongoose = require('mongoose');

class CourseService {
  async getAllCourses(query, user) {
    let filter = {};

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.category && query.category !== 'All') {
      filter.category = query.category;
    }

    if (query.instructor) {
      filter.instructor = query.instructor;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priceType === 'free') {
      filter.price = 0;
    } else if (query.priceType === 'paid') {
      filter.price = { $gt: 0 };
    }

    if (query.minRating) {
      filter.averageRating = { $gte: Number(query.minRating) };
    }

    if (!user || user.role === 'student') {
      filter.status = 'published';
    }

    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const sort = query.sort || '-createdAt';

    const { total, data } = await courseRepository.findPaginatedWithStats(filter, skip, limit, sort);

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
    if (courseData.category && !mongoose.Types.ObjectId.isValid(courseData.category)) {
      throw new AppError('Danh mục không hợp lệ', 400);
    }

    if (!courseData.slug) {
      courseData.slug = slugify(courseData.title, { lower: true, strict: true });
    }

    const existingCourse = await courseRepository.findBySlug(courseData.slug);
    if (existingCourse) {
      throw new AppError('Tiêu đề khóa học này đã tồn tại, vui lòng chọn tiêu đề khác', 400);
    }

    if (user.role === 'admin' && courseData.instructor) {
      // Do nothing, keep courseData.instructor as provided
    } else {
      courseData.instructor = user.id;
    }

    if (courseData.estimatedPrice !== undefined && courseData.discountPercentage !== undefined) {
      const estimatedPrice = Number(courseData.estimatedPrice) || 0;
      const discountPercentage = Number(courseData.discountPercentage) || 0;
      courseData.price = Math.round(estimatedPrice * (1 - discountPercentage / 100));
    } else if (courseData.estimatedPrice !== undefined && courseData.price === undefined) {
      courseData.price = Number(courseData.estimatedPrice) || 0;
    }

    return await courseRepository.create(courseData);
  }

  async updateCourse(id, updateData, user) {
    if (updateData.category && !mongoose.Types.ObjectId.isValid(updateData.category)) {
      throw new AppError('Danh mục không hợp lệ', 400);
    }

    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền chỉnh sửa khóa học của người khác', 403);
    }

    if (user.role !== 'admin') {
      delete updateData.instructor; 
      
      if (updateData.status === 'published' && course.status !== 'published') {
        throw new AppError('Chỉ Admin mới có quyền duyệt và xuất bản khóa học.', 403);
      }
    }

    if (updateData.title && !updateData.slug) {
      updateData.slug = slugify(updateData.title, { lower: true, strict: true });
    }

    const estPrice = updateData.estimatedPrice !== undefined ? updateData.estimatedPrice : course.estimatedPrice;
    const discPct = updateData.discountPercentage !== undefined ? updateData.discountPercentage : course.discountPercentage;
    if (updateData.estimatedPrice !== undefined || updateData.discountPercentage !== undefined) {
      const estimatedPrice = Number(estPrice) || 0;
      const discountPercentage = Number(discPct) || 0;
      updateData.price = Math.round(estimatedPrice * (1 - discountPercentage / 100));
    }

    return await courseRepository.updateById(id, updateData);
  }

  async deleteCourse(id, user) {
    const course = await courseRepository.findById(id);
    if (!course) {
      throw new AppError('Không tìm thấy khóa học này', 404);
    }

    if (user.role !== 'admin' && course.instructor._id.toString() !== user.id) {
      throw new AppError('Bạn không có quyền xóa khóa học của người khác', 403);
    }

    return await courseRepository.deleteById(id);
  }
}

module.exports = new CourseService();
