const BaseRepository = require('./base.repository');
const Category = require('../../models/Category');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  async findBySlug(slug) {
    return await this.model.findOne({ slug });
  }
}

module.exports = new CategoryRepository();
