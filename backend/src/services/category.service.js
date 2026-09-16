const categoryRepository = require('../repositories/category.repository');
const AppError = require('../utils/appError');
const slugify = require('slugify');

class CategoryService {
  async getAllCategories() {
    return await categoryRepository.find();
  }

  async getCategoryById(id) {
    const category = await categoryRepository.findById(id);
    if (!category) {
      throw new AppError('Không tìm thấy danh mục với ID này', 404);
    }
    return category;
  }

  async createCategory(categoryData) {
    // Tự động tạo slug nếu chưa có
    if (!categoryData.slug) {
      const nameStr = typeof categoryData.name === 'object' && categoryData.name !== null
        ? (categoryData.name.en || categoryData.name.vi || Object.values(categoryData.name)[0] || '')
        : String(categoryData.name || '');
      categoryData.slug = slugify(nameStr, { lower: true, strict: true });
    }

    // Kiểm tra trùng lặp slug
    const existingCategory = await categoryRepository.findBySlug(categoryData.slug);
    if (existingCategory) {
      throw new AppError('Tên danh mục hoặc slug đã tồn tại', 400);
    }

    return await categoryRepository.create(categoryData);
  }

  async updateCategory(id, updateData) {
    if (updateData.name && !updateData.slug) {
      const nameStr = typeof updateData.name === 'object' && updateData.name !== null
        ? (updateData.name.en || updateData.name.vi || Object.values(updateData.name)[0] || '')
        : String(updateData.name || '');
      updateData.slug = slugify(nameStr, { lower: true, strict: true });
    }

    const category = await categoryRepository.updateById(id, updateData);
    if (!category) {
      throw new AppError('Không tìm thấy danh mục với ID này', 404);
    }
    return category;
  }

  async deleteCategory(id) {
    require('../models/Course');
    const mongoose = require('mongoose');
    if (id && mongoose.Types.ObjectId.isValid(id)) {
      const courseCount = await mongoose.model('Course').countDocuments({ category: id });
      if (courseCount > 0) {
        throw new AppError(`Không thể xóa danh mục này vì đang có ${courseCount} khóa học đang sử dụng. Vui lòng chuyển danh mục cho các khóa học trước khi xóa.`, 400);
      }
    }


    const category = await categoryRepository.deleteById(id);
    if (!category) {
      throw new AppError('Không tìm thấy danh mục với ID này', 404);
    }
    return category;
  }
}

module.exports = new CategoryService();
