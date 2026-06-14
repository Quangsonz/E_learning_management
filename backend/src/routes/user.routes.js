const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');

const router = express.Router();

// BẢO VỆ TOÀN BỘ API BÊN DƯỚI (Yêu cầu phải có token)
router.use(authMiddleware.protect);

// ==========================================
// API CHUNG CHO MỌI ROLE (PROFILE CÁ NHÂN)
// ==========================================
// Lấy thông tin profile cá nhân
router.get('/me', userController.getMe, userController.getUser);
// Cập nhật thông tin profile (chỉ update những trường an toàn)
router.patch('/updateMe', userController.updateMe);

// ==========================================
// API CHO TEACHER & ADMIN
// ==========================================
// Lấy danh sách toàn bộ Users (Teacher thì có thể xem Student, Admin thì xem toàn bộ)
// Ở Controller getAllUsers ta có thể lọc thêm role: 'student' nếu req.user.role === 'teacher'
router
  .route('/')
  .get(requireRole('admin', 'teacher'), requirePermission('view_students'), userController.getAllUsers);

// ==========================================
// API DÀNH RIÊNG CHO ADMIN (CRUD USER)
// ==========================================
// Chỉ có Admin mới được đi tiếp xuống bên dưới
router.use(requireRole('admin'));
router.use(requirePermission('manage_users'));

router.post('/', userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
