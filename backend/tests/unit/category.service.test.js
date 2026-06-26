const categoryService = require('../../src/services/category.service');
const categoryRepository = require('../../src/repositories/category.repository');
const AppError = require('../../src/utils/appError');
const slugify = require('slugify');

jest.mock('../../src/repositories/category.repository');

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCategories', () => {
    it('should return all categories', async () => {
      const mockCategories = [{ name: 'Test 1' }, { name: 'Test 2' }];
      categoryRepository.find.mockResolvedValue(mockCategories);

      const result = await categoryService.getAllCategories();
      expect(result).toEqual(mockCategories);
      expect(categoryRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoryById', () => {
    it('should return category if found', async () => {
      const mockCategory = { id: '1', name: 'Web' };
      categoryRepository.findById.mockResolvedValue(mockCategory);

      const result = await categoryService.getCategoryById('1');
      expect(result).toEqual(mockCategory);
      expect(categoryRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw error if category not found', async () => {
      categoryRepository.findById.mockResolvedValue(null);
      await expect(categoryService.getCategoryById('1')).rejects.toThrow(AppError);
    });
  });

  describe('createCategory', () => {
    it('should create category and generate slug if not provided', async () => {
      const categoryData = { name: 'Web Development' };
      categoryRepository.findBySlug.mockResolvedValue(null);
      categoryRepository.create.mockResolvedValue({ ...categoryData, slug: 'web-development' });

      const result = await categoryService.createCategory(categoryData);
      
      expect(categoryRepository.findBySlug).toHaveBeenCalledWith('web-development');
      expect(categoryRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ slug: 'web-development' })
      );
      expect(result.slug).toBe('web-development');
    });

    it('should throw error if slug already exists', async () => {
      categoryRepository.findBySlug.mockResolvedValue({ id: '2' });
      
      await expect(categoryService.createCategory({ name: 'Web', slug: 'web' }))
        .rejects.toThrow('Tên danh mục hoặc slug đã tồn tại');
    });
  });

  describe('updateCategory', () => {
    it('should update category and generate new slug if name is updated but slug is not provided', async () => {
      const updateData = { name: 'Mobile Dev' };
      categoryRepository.updateById.mockResolvedValue({ ...updateData, slug: 'mobile-dev' });

      await categoryService.updateCategory('1', updateData);

      expect(categoryRepository.updateById).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ slug: 'mobile-dev' })
      );
    });

    it('should throw error if category not found to update', async () => {
      categoryRepository.updateById.mockResolvedValue(null);
      await expect(categoryService.updateCategory('1', { name: 'Test' }))
        .rejects.toThrow(AppError);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category if found', async () => {
      categoryRepository.deleteById.mockResolvedValue({ id: '1' });
      await categoryService.deleteCategory('1');
      expect(categoryRepository.deleteById).toHaveBeenCalledWith('1');
    });

    it('should throw error if category not found to delete', async () => {
      categoryRepository.deleteById.mockResolvedValue(null);
      await expect(categoryService.deleteCategory('1')).rejects.toThrow(AppError);
    });
  });
});
