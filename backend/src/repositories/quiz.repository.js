const BaseRepository = require('./base.repository');
const Quiz = require('../models/Quiz');

class QuizRepository extends BaseRepository {
  constructor() {
    super(Quiz);
  }

  async findByCourse(courseId) {
    return await this.model.find({ course: courseId });
  }
}

module.exports = new QuizRepository();
