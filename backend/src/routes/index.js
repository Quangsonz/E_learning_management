const express = require('express');
const userRoutes = require('./user.routes');
const authRoutes = require('./auth.routes');
const categoryRoutes = require('./category.routes');
const courseRoutes = require('./course.routes');
const uploadRoutes = require('./upload.routes');
const enrollmentRoutes = require('./enrollment.routes');
const progressRoutes = require('./progress.routes');
const quizRoutes = require('./quiz.routes');
const certificateRoutes = require('./certificate.routes');
const notificationRoutes = require('./notification.routes');
const analyticsRoutes = require('./analytics.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/categories', categoryRoutes);
router.use('/courses', courseRoutes);
router.use('/upload', uploadRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/progress', progressRoutes);
router.use('/quizzes', quizRoutes);
router.use('/certificates', certificateRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);
// Student Dashboard — Nested route: /students/:id/dashboard/*
router.use('/students/:id/dashboard', dashboardRoutes);

// Mount nested quiz creation route in course
// But since we can use /api/quizzes directly or nested, we mounted it on /quizzes

// Mount other routes here in the future
// router.use('/courses', courseRoutes);

module.exports = router;
