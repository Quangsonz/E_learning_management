const AuditLog = require('../models/AuditLog');

exports.logAdminAction = (actionName, targetModel = null) => {
  return (req, res, next) => {
    res.on('finish', async () => {
      // Chỉ lưu logs nếu thao tác thành công (HTTP status 2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const actor = req.user ? req.user.id : null;
          if (!actor) return; // Chỉ lưu vết các thao tác có định danh người dùng

          let targetId = req.params.id || req.body.id || null;
          if (targetId && !targetId.match(/^[0-9a-fA-F]{24}$/)) {
            targetId = null;
          }

          const details = {
            method: req.method,
            url: req.originalUrl,
            body: { ...req.body }
          };

          // Loại bỏ mật khẩu hoặc thông tin nhạy cảm
          if (details.body.password) delete details.body.password;
          if (details.body.currentPassword) delete details.body.currentPassword;
          if (details.body.newPassword) delete details.body.newPassword;

          await AuditLog.create({
            actor,
            action: actionName,
            targetId,
            targetModel,
            details,
            ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
            userAgent: req.headers['user-agent']
          });
        } catch (error) {
          console.error('Failed to create audit log:', error);
        }
      }
    });
    next();
  };
};
