const BaseRepository = require('./base.repository');
const Question = require('../models/Question');

class QuestionRepository extends BaseRepository {
  constructor() {
    super(Question);
  }

  async findByQuiz(quizId) {
    return await this.model.find({ quiz: quizId });
  }

  async findByLesson(lessonId) {
    return await this.model.find({ lesson: lessonId });
  }

  async findInLessons(lessonIds) {
    return await this.model.find({ lesson: { $in: lessonIds } });
  }
}

module.exports = new QuestionRepository();
