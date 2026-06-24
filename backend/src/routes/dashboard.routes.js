/**
 * @swagger
 * tags:
 *   name: Student Dashboard
 *   description: API tổng quan dành riêng cho Student Dashboard (Home Page)
 */

const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { protect } = require('../middlewares/auth.middleware');
const { restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true }); // mergeParams để nhận :id từ parent router

// Tất cả các route Dashboard đều yêu cầu đăng nhập
router.use(protect);
// Chỉ học viên và admin mới có thể truy cập
router.use(restrictTo('student', 'admin'));

/**
 * @swagger
 * /students/{id}/dashboard/summary:
 *   get:
 *     summary: "[TỔNG HỢP] Lấy toàn bộ dữ liệu Dashboard trong 1 request"
 *     description: >
 *       Gọi song song 6 API con bằng Promise.all(). Giảm 6 HTTP round-trips xuống còn 1.
 *       Nếu 1 API con lỗi, field tương ứng trả về null, không crash toàn bộ response.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId của học viên
 *     responses:
 *       200:
 *         description: Thành công — Trả về toàn bộ data dashboard
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 stats:
 *                   studentName: "Nguyễn Văn A"
 *                   learningRing: 68
 *                   stats: { studyStreak: 7, averageScore: 82, focusTime: 24.5, activeCourses: 3 }
 *                   heroStats: { focusBoostPercent: 75, quizAvgScore: 82, totalQuizzesCompleted: 5, passRate: 80 }
 *                 activeCourses:
 *                   - { courseId: "...", title: "React.js Zero to Hero", category: "Lập trình Web", progress: 72, lesson: "React Hooks - useEffect nâng cao" }
 *                 upcomingQuizzes:
 *                   - { quizId: "...", title: "Quiz: React Hooks", subtitle: "React.js Zero to Hero", time: "Tomorrow, 8:30 AM", timeLimit: "30 phút", passingScore: 70 }
 *                 recentActivities:
 *                   - { type: "lesson", title: "Xem bài học", detail: "React Hooks - useEffect nâng cao", time: "12 phút trước", progress: "72%" }
 *                 recommendedCourses:
 *                   - { courseId: "...", title: "TypeScript Pro", category: "Lập trình Web", rating: 4.9, students: "8.9k" }
 *                 announcements:
 *                   - { notificationId: "...", title: "Khóa học của bạn đã được cập nhật nội dung mới.", sender: "Giảng viên", time: "2 giờ trước", isNew: true }
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập dashboard của học viên khác
 */
router.get('/summary', dashboardController.getDashboardSummary);

/**
 * @swagger
 * /students/{id}/dashboard/stats:
 *   get:
 *     summary: Thống kê tổng quan học tập
 *     description: Trả về learningRing, studyStreak, averageScore, focusTime, activeCourses, heroStats.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 studentName: "Nguyễn Văn A"
 *                 learningRing: 68
 *                 stats: { studyStreak: 7, averageScore: 82, focusTime: 24.5, activeCourses: 3 }
 *                 heroStats: { focusBoostPercent: 75, quizAvgScore: 82, totalQuizzesCompleted: 5, passRate: 80 }
 *       404:
 *         description: Không tìm thấy học viên
 */
router.get('/stats', dashboardController.getStats);

/**
 * @swagger
 * /students/{id}/dashboard/active-courses:
 *   get:
 *     summary: Danh sách khóa học đang học
 *     description: Trả về các khóa học đã enrolled (paymentStatus completed) và chưa hoàn thành 100%.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               results: 3
 *               data:
 *                 - courseId: "6657a..."
 *                   title: "React.js Zero to Hero"
 *                   category: "Lập trình Web"
 *                   progress: 72
 *                   lesson: "React Hooks - useEffect nâng cao"
 *                   thumbnailUrl: "https://cdn.example.com/react.jpg"
 */
router.get('/active-courses', dashboardController.getActiveCourses);

/**
 * @swagger
 * /students/{id}/dashboard/upcoming-quizzes:
 *   get:
 *     summary: Bài kiểm tra sắp tới
 *     description: Trả về các quiz chưa làm, thuộc khóa học đã đăng ký, còn trong thời hạn.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               results: 2
 *               data:
 *                 - quizId: "6657b..."
 *                   title: "Quiz: React Hooks"
 *                   subtitle: "React.js Zero to Hero"
 *                   time: "Tomorrow, 8:30 AM"
 *                   timeLimit: "30 phút"
 *                   passingScore: 70
 */
router.get('/upcoming-quizzes', dashboardController.getUpcomingQuizzes);

/**
 * @swagger
 * /students/{id}/dashboard/recent-activities:
 *   get:
 *     summary: Hoạt động gần đây
 *     description: >
 *       Gộp 2 nguồn dữ liệu: lịch sử xem bài học (từ Progress) và lịch sử làm quiz (từ Result).
 *       Sắp xếp theo thời gian mới nhất, trả về tối đa 10 mục.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               results: 5
 *               data:
 *                 - type: "lesson"
 *                   title: "Xem bài học"
 *                   detail: "React Hooks - useEffect nâng cao"
 *                   time: "12 phút trước"
 *                   progress: "72%"
 *                 - type: "quiz"
 *                   title: "Hoàn thành Quiz"
 *                   detail: "Quiz: JavaScript cơ bản"
 *                   time: "2 giờ trước"
 *                   isPassed: true
 *                   score: "85%"
 */
router.get('/recent-activities', dashboardController.getRecentActivities);

/**
 * @swagger
 * /students/{id}/dashboard/recommended-courses:
 *   get:
 *     summary: Khóa học đề xuất (Dành riêng cho bạn)
 *     description: >
 *       Gợi ý khóa học học viên CHƯA đăng ký, ưu tiên theo preferences (danh mục yêu thích).
 *       Fallback sang rating cao nhất nếu không đủ 6 kết quả từ preferences.
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               results: 6
 *               data:
 *                 - courseId: "6657c..."
 *                   title: "TypeScript Pro"
 *                   category: "Lập trình Web"
 *                   rating: 4.9
 *                   students: "8.9k"
 *                   thumbnailUrl: "https://cdn.example.com/ts.jpg"
 *                   price: 499000
 */
router.get('/recommended-courses', dashboardController.getRecommendedCourses);

/**
 * @swagger
 * /students/{id}/dashboard/announcements:
 *   get:
 *     summary: Thông báo mới nhất
 *     description: Trả về 5 thông báo gần nhất (hệ thống, khóa học, thanh toán, chứng chỉ).
 *     tags: [Student Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               results: 3
 *               data:
 *                 - notificationId: "6657d..."
 *                   title: "Khóa học của bạn đã được cập nhật nội dung mới."
 *                   sender: "Giảng viên"
 *                   time: "2 giờ trước"
 *                   isNew: true
 *                   type: "course"
 *                   link: "/courses/react-zero-hero"
 */
router.get('/announcements', dashboardController.getAnnouncements);

module.exports = router;
