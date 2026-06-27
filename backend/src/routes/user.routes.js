const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: API quản lý người dùng
 */

// ==========================================
// BẢO VỆ TOÀN BỘ API BÊN DƯỚI (Yêu cầu phải có token)
// ==========================================
router.use(authMiddleware.protect);

// ==========================================
// API CHUNG CHO MỌI ROLE (PROFILE CÁ NHÂN)
// ==========================================

router.get('/leaderboard', userController.getLeaderboard);
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist', userController.toggleWishlist);

/**
 * @swagger
 * /users/me:
 *   get:
 *     summary: Lấy thông tin profile cá nhân
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Thông tin profile người dùng hiện tại
 *       401:
 *         description: Chưa đăng nhập
 */
router.get('/me', userController.getMe, userController.getUser);

/**
 * @swagger
 * /users/updateMe:
 *   patch:
 *     summary: Cập nhật thông tin profile cá nhân
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/updateMe', userController.updateMe);

/**
 * @swagger
 * /users/changePassword:
 *   patch:
 *     summary: Thay đổi mật khẩu
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Mật khẩu đã được thay đổi thành công
 *       401:
 *         description: Mật khẩu hiện tại không chính xác
 */
router.patch('/changePassword', userController.changePassword);

// ==========================================
// API CHO TEACHER & ADMIN
// ==========================================
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lấy danh sách người dùng (Admin & Teacher)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách người dùng
 *       403:
 *         description: Không có quyền truy cập
 */
router
  .route('/')
  .get(requireRole('admin', 'teacher'), requirePermission('view_students'), userController.getAllUsers);

// ==========================================
// API DÀNH RIÊNG CHO ADMIN (CRUD USER)
// ==========================================
router.use(requireRole('admin'));
router.use(requirePermission('manage_users'));

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Tạo người dùng mới (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Tạo người dùng thành công
 */
router.post('/', userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Lấy thông tin user theo ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *   patch:
 *     summary: Cập nhật user theo ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *   delete:
 *     summary: Xóa user theo ID (Admin only)
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 */
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
