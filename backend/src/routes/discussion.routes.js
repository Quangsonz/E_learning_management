const express = require('express');
const discussionController = require('../controllers/discussion.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router({ mergeParams: true });

router.use(authMiddleware.protect);

// Routes for discussions (mounted at /api/courses/:courseId/lessons/:lessonId/discussions)
router.get('/', discussionController.getDiscussionsByLesson);
router.post('/', discussionController.createDiscussion);

// Routes for specific discussion
router.get('/:discussionId/comments', discussionController.getCommentsByDiscussion);
router.post('/:discussionId/comments', discussionController.addComment);
router.post('/:discussionId/upvote', discussionController.toggleUpvoteDiscussion);

module.exports = router;
