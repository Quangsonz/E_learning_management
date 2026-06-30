const discussionService = require('../services/discussion.service');
const catchAsync = require('../utils/catchAsync');

class DiscussionController {
  getDiscussionsByLesson = catchAsync(async (req, res, next) => {
    const { lessonId } = req.params;
    const discussions = await discussionService.getDiscussionsByLesson(lessonId);
    res.status(200).json({ status: 'success', data: { discussions } });
  });

  createDiscussion = catchAsync(async (req, res, next) => {
    const { courseId, lessonId } = req.params;
    const { content } = req.body;
    const discussion = await discussionService.createDiscussion(courseId, lessonId, req.user.id, content);
    res.status(201).json({ status: 'success', data: { discussion } });
  });

  getCommentsByDiscussion = catchAsync(async (req, res, next) => {
    const { discussionId } = req.params;
    const comments = await discussionService.getCommentsByDiscussion(discussionId);
    res.status(200).json({ status: 'success', data: { comments } });
  });

  addComment = catchAsync(async (req, res, next) => {
    const { discussionId } = req.params;
    const { content } = req.body;
    const comment = await discussionService.addComment(discussionId, req.user.id, content);
    res.status(201).json({ status: 'success', data: { comment } });
  });

  toggleUpvoteDiscussion = catchAsync(async (req, res, next) => {
    const { discussionId } = req.params;
    const discussion = await discussionService.toggleUpvoteDiscussion(discussionId, req.user.id);
    res.status(200).json({ status: 'success', data: { discussion } });
  });
}

module.exports = new DiscussionController();
