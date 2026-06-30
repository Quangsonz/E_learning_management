const Discussion = require('../models/Discussion');
const Comment = require('../models/Comment');
const AppError = require('../utils/appError');
const notificationService = require('./notification.service');
const xpService = require('./xp.service');
const Course = require('../models/Course');

class DiscussionService {
  async getDiscussionsByLesson(lessonId) {
    return await Discussion.find({ lesson: lessonId })
      .populate('author', 'name avatar')
      .sort('-createdAt');
  }

  async createDiscussion(courseId, lessonId, userId, content) {
    const discussion = await Discussion.create({
      course: courseId,
      lesson: lessonId,
      author: userId,
      content
    });

    // Notify instructor
    const course = await Course.findById(courseId);
    if (course && course.instructor.toString() !== userId.toString()) {
      await notificationService.createNotification({
        recipient: course.instructor,
        title: 'Có câu hỏi mới trong khóa học của bạn',
        message: `Một học viên vừa đặt câu hỏi trong khóa học "${course.title}".`,
        type: 'course',
        link: `/courses/${courseId}/learn`
      });
    }

    await xpService.addXP(userId, 'DISCUSSION_POST');

    return await discussion.populate('author', 'name avatar');
  }

  async getCommentsByDiscussion(discussionId) {
    return await Comment.find({ discussion: discussionId })
      .populate('author', 'name avatar role')
      .sort('createdAt');
  }

  async addComment(discussionId, userId, content) {
    const comment = await Comment.create({
      discussion: discussionId,
      author: userId,
      content
    });
    const discussion = await Discussion.findByIdAndUpdate(discussionId, { $inc: { commentsCount: 1 } });
    
    // Notify discussion author
    if (discussion && discussion.author.toString() !== userId.toString()) {
      await notificationService.createNotification({
        recipient: discussion.author,
        title: 'Có phản hồi mới cho câu hỏi của bạn',
        message: 'Ai đó vừa bình luận về câu hỏi của bạn.',
        type: 'course',
        link: `/courses/${discussion.course}/learn`
      });
    }

    await xpService.addXP(userId, 'DISCUSSION_POST');

    return await comment.populate('author', 'name avatar role');
  }

  async toggleUpvoteDiscussion(discussionId, userId) {
    const discussion = await Discussion.findById(discussionId);
    if (!discussion) throw new AppError('Discussion not found', 404);
    
    const index = discussion.upvotes.indexOf(userId);
    if (index === -1) {
      discussion.upvotes.push(userId);
      await xpService.addXP(discussion.author, 'DISCUSSION_UPVOTE');
    } else {
      discussion.upvotes.splice(index, 1);
    }
    await discussion.save();
    return discussion;
  }
}

module.exports = new DiscussionService();
