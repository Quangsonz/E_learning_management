const express = require('express');
const moduleController = require('../controllers/module.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const { requirePermission } = require('../middlewares/permissionMiddleware');
const validate = require('../middlewares/validate.middleware');
const moduleValidation = require('../validations/module.validation');

// mergeParams: true giúp nhận được params từ nested route (VD: /courses/:courseId/modules)
const router = express.Router({ mergeParams: true });

// Học viên/khách có thể xem cấu trúc chương học (để render Curriculum)
router.get('/', authMiddleware.optionalProtect, moduleController.getModules);
router.get('/:id', validate(moduleValidation.getModule), authMiddleware.optionalProtect, moduleController.getModule);

router.use(authMiddleware.protect);

// Chỉ Teacher và Admin mới được thao tác thêm, sửa, xóa chương học
router.use(requireRole('admin', 'teacher'));

router.post('/', requirePermission('edit_own_course'), validate(moduleValidation.createModule), moduleController.createModule);

// Route for reordering modules
router.patch('/reorder', requirePermission('edit_own_course'), validate(moduleValidation.reorderModules), moduleController.reorderModules);

router
  .route('/:id')
  .patch(requirePermission('edit_own_course'), validate(moduleValidation.updateModule), moduleController.updateModule)
  .delete(requirePermission('delete_own_course'), validate(moduleValidation.deleteModule), moduleController.deleteModule);

module.exports = router;
