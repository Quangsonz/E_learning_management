require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const socketLayer = require('./src/socket');

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB();

// Create HTTP Server thay vì dùng app.listen trực tiếp
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
socketLayer.init(httpServer);

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections (e.g. database connection issues)
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  console.error('Shutting down the server due to Unhandled Promise Rejection');
  server.close(() => {
    process.exit(1);
  });
});