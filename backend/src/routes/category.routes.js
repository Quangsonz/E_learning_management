const express = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

/**
 * @swagger
 * /categories:
 *   get:
 *     summary: Lấy danh sách tất cả danh mục
 *     tags: [Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *   post:
 *     summary: Tạo danh mục mới (Admin only)
 *     tags: [Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       201:
 *         description: Tạo danh mục thành công
 *       403:
 *         description: Không có quyền
 */
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);

router.use(authMiddleware.protect);
router.use(requireRole('admin'));
router.use(requirePermission('manage_categories'));

router.post('/', categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     summary: Lấy thông tin 1 danh mục
 *     tags: [Categories]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *       404:
 *         description: Không tìm thấy danh mục
 *   patch:
 *     summary: Cập nhật danh mục (Admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryRequest'
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     summary: Xóa danh mục (Admin only)
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Xóa thành công
 */
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
