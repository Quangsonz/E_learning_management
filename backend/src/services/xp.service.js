const User = require('../models/User');
const notificationService = require('./notification.service');

const XP_MAP = {
  LESSON_COMPLETE: 50,
  QUIZ_COMPLETE: 100,
  COURSE_COMPLETE: 500,
  STREAK_BONUS: 20, // per day of streak
  DISCUSSION_POST: 10,
  DISCUSSION_UPVOTE: 5
};

const BADGES_MAP = {
  FIRST_LESSON: { name: 'First Steps', icon: '🎯', description: 'Completed first lesson' },
  QUIZ_MASTER: { name: 'Quiz Master', icon: '🏆', description: 'Scored 100% on a quiz' },
  COURSE_GRADUATE: { name: 'Graduate', icon: '🎓', description: 'Completed a course' },
  STREAK_7: { name: '7-Day Streak', icon: '🔥', description: 'Studied for 7 days in a row' }
};

class XPService {
  calculateLevel(xp) {
    // Level formula: level = 1 + floor(sqrt(xp / 100))
    // e.g. 0-99 = Lvl 1, 100-399 = Lvl 2, 400-899 = Lvl 3, 900-1599 = Lvl 4
    return 1 + Math.floor(Math.sqrt(xp / 100));
  }

  async addXP(userId, action, customAmount = 0) {
    const user = await User.findById(userId);
    if (!user) return;

    let xpToAdd = customAmount || XP_MAP[action] || 0;
    if (xpToAdd <= 0) return;

    const oldLevel = user.level || 1;
    user.xp += xpToAdd;
    
    const newLevel = this.calculateLevel(user.xp);
    
    if (newLevel > oldLevel) {
      user.level = newLevel;
      // Triger Level Up Notification
      await notificationService.createNotification({
        recipient: user._id,
        title: 'Thăng cấp! 🎉',
        message: `Chúc mừng bạn đã đạt cấp độ ${newLevel}!`,
        type: 'system',
        link: '/profile'
      });
    }

    await user.save();
    return { xp: user.xp, level: user.level, leveledUp: newLevel > oldLevel };
  }

  async awardBadge(userId, badgeKey) {
    const user = await User.findById(userId);
    if (!user) return;

    const badgeInfo = BADGES_MAP[badgeKey];
    if (!badgeInfo) return;

    const hasBadge = user.badges && user.badges.some(b => b.name === badgeInfo.name);
    if (hasBadge) return; // Already has badge

    if (!user.badges) user.badges = [];
    user.badges.push({
      name: badgeInfo.name,
      icon: badgeInfo.icon,
      description: badgeInfo.description
    });

    await notificationService.createNotification({
      recipient: user._id,
      title: 'Huy hiệu mới! 🏅',
      message: `Bạn vừa nhận được huy hiệu: ${badgeInfo.name} - ${badgeInfo.description}`,
      type: 'system',
      link: '/profile'
    });

    await user.save();
    return badgeInfo;
  }
}

module.exports = new XPService();
