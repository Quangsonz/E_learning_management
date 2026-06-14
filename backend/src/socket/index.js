const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

// Map lưu trữ người dùng đang online (key: userId, value: socketId)
// Trong ứng dụng thực tế có thể có 1 user đăng nhập nhiều thiết bị, do đó value có thể là mảng các socketId
const connectedUsers = new Map();

exports.init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: '*', // Trong production nên cấu hình origin cụ thể (VD: http://localhost:3000)
      methods: ['GET', 'POST']
    }
  });

  // Middleware bắt kết nối để xác thực Token (Chỉ user đăng nhập mới được dùng Socket)
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Người dùng ${socket.userId} kết nối (Socket ID: ${socket.id})`);

    // Lưu socketId vào map
    if (!connectedUsers.has(socket.userId)) {
      connectedUsers.set(socket.userId, new Set());
    }
    connectedUsers.get(socket.userId).add(socket.id);

    // Xử lý ngắt kết nối
    socket.on('disconnect', () => {
      console.log(`❌ Người dùng ${socket.userId} ngắt kết nối`);
      const userSockets = connectedUsers.get(socket.userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(socket.userId);
        }
      }
    });
  });

  return io;
};

// Hàm hỗ trợ để các Service khác gọi và gửi thông báo
exports.sendNotificationToUser = (userId, notificationData) => {
  if (!io) return; // Tránh lỗi nếu gọi khi chưa init

  const userSockets = connectedUsers.get(userId.toString());
  if (userSockets && userSockets.size > 0) {
    // Phát event 'new_notification' tới tất cả thiết bị (tab) của user đó
    for (const socketId of userSockets) {
      io.to(socketId).emit('new_notification', notificationData);
    }
  }
};
