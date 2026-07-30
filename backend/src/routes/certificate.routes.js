const express = require('express');
const certificateController = require('../controllers/certificate.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /certificates/verify/{certificateId}:
 *   get:
 *     summary: Xác minh tính hợp lệ của chứng chỉ (Public)
 *     tags: [Certificates]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: certificateId
 *         required: true
 *         schema:
 *           type: string
 *         description: Mã chứng chỉ ngắn (VD 8F2B1A0D)
 *     responses:
 *       200:
 *         description: Chứng chỉ hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     isValid:
 *                       type: boolean
 *                       example: true
 *                     certificate:
 *                       $ref: '#/components/schemas/Certificate'
 *       404:
 *         description: Chứng chỉ không hợp lệ
 *
 * /certificates/my-certificates:
 *   get:
 *     summary: Lấy danh sách chứng chỉ của tôi
 *     tags: [Certificates]
 *     responses:
 *       200:
 *         description: Thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificates:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Certificate'
 *
 * /certificates/claim/{courseId}:
 *   post:
 *     summary: Nhận chứng chỉ (Yêu cầu hoàn thành 100% khóa học)
 *     tags: [Certificates]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Chứng chỉ đã được cấp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificate:
 *                       $ref: '#/components/schemas/Certificate'
 *       403:
 *         description: Chưa hoàn thành 100% khóa học
 */
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/:certificateId/pdf', certificateController.downloadCertificatePDF);
router.get('/pdf/:certificateId', certificateController.downloadCertificatePDF);

router.use(authMiddleware.protect);
router.get('/my-certificates', certificateController.getMyCertificates);
router.post('/claim/:courseId', certificateController.claimCertificate);

module.exports = router;
