const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Đăng ký thành công. Email xác minh đã được gửi.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Email đã tồn tại
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', authController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Email hoặc mật khẩu không chính xác
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Yêu cầu đặt lại mật khẩu
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: nguyenvana@gmail.com
 *     responses:
 *       200:
 *         description: Link đặt lại mật khẩu đã được gửi qua email
 *       404:
 *         description: Không tìm thấy email
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   patch:
 *     summary: Đặt lại mật khẩu bằng token
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token đặt lại mật khẩu (nhận từ email)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Đặt lại mật khẩu thành công
 *       400:
 *         description: Token không hợp lệ hoặc đã hết hạn
 */
router.patch('/reset-password/:token', authController.resetPassword);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Xác minh địa chỉ email
 *     tags: [Auth]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token xác minh email (nhận từ email sau khi đăng ký)
 *     responses:
 *       200:
 *         description: Email đã được xác minh thành công
 *       400:
 *         description: Token không hợp lệ
 */
router.get('/verify-email/:token', authController.verifyEmail);

module.exports = router;
