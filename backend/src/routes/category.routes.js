const express = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

// Public routes: Ai cũng xem được danh mục
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);

// Protected routes: Chỉ Admin mới có quyền CRUD danh mục
router.use(authMiddleware.protect);
router.use(requireRole('admin'));
router.use(requirePermission('manage_categories'));

router.post('/', categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
