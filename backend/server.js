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

const mongoose = require('mongoose');

const server = httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown on SIGTERM / SIGINT (Render restarts, zero-downtime deploys)
const gracefulShutdown = (signal) => {
  console.log(`⚠️ Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await mongoose.connection.close(false);
      console.log('MongoDB connection closed.');
    } catch (err) {
      console.error('Error closing MongoDB connection:', err.message);
    }
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections (e.g. database connection issues)
process.on('unhandledRejection', (err) => {
  console.error(`Error: ${err.message}`);
  console.error('Shutting down the server due to Unhandled Promise Rejection');
  server.close(() => {
    process.exit(1);
  });
});