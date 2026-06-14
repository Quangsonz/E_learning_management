const BaseRepository = require('./base.repository');
const Question = require('../../models/Question');

class QuestionRepository extends BaseRepository {
  constructor() {
    super(Question);
  }

  async findByQuiz(quizId) {
    return await this.model.find({ quiz: quizId });
  }
}

module.exports = new QuestionRepository();
