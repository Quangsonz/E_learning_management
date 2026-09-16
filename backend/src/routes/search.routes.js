const express = require('express');
const searchController = require('../controllers/search.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { searchLimiter } = require('../middlewares/rateLimiter.middleware');
const validate = require('../middlewares/validate.middleware');
const searchValidation = require('../validations/search.validation');

const router = express.Router();

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Global Search across courses, lessons, categories, users, etc.
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, courses, lessons, categories, instructors, users, orders, applications]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Search results grouped by entity
 */
router.get('/', searchLimiter, validate(searchValidation.globalSearch), authMiddleware.optionalProtect, searchController.globalSearch);

module.exports = router;
