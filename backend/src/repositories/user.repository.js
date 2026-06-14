const BaseRepository = require('./base.repository');
const User = require('../../models/User'); // Update import if model is moved to src/models later

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    // Include password field if needed explicitly for auth logic
    return await this.model.findOne({ email }).select('+password');
  }
}

module.exports = new UserRepository();
