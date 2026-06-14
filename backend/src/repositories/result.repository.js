const BaseRepository = require('./base.repository');
const Result = require('../../models/Result');

class ResultRepository extends BaseRepository {
  constructor() {
    super(Result);
  }

  async findByStudentAndQuiz(studentId, quizId) {
    return await this.model.findOne({ student: studentId, quiz: quizId });
  }
}

module.exports = new ResultRepository();
