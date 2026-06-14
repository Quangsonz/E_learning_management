const categoryService = require('../services/category.service');
const catchAsync = require('../utils/catchAsync');

class CategoryController {
  getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await categoryService.getAllCategories();

    res.status(200).json({
      status: 'success',
      results: categories.length,
      data: {
        categories,
      },
    });
  });

  getCategory = catchAsync(async (req, res, next) => {
    const category = await categoryService.getCategoryById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: {
        category,
      },
    });
  });

  createCategory = catchAsync(async (req, res, next) => {
    const newCategory = await categoryService.createCategory(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        category: newCategory,
      },
    });
  });

  updateCategory = catchAsync(async (req, res, next) => {
    const updatedCategory = await categoryService.updateCategory(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      data: {
        category: updatedCategory,
      },
    });
  });

  deleteCategory = catchAsync(async (req, res, next) => {
    await categoryService.deleteCategory(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
}

module.exports = new CategoryController();
