class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return await this.model.create(data);
  }

  async findById(id) {
    return await this.model.findById(id);
  }

  async findOne(query) {
    return await this.model.findOne(query);
  }

  async find(query = {}) {
    return await this.model.find(query);
  }

  async findOneAndUpdate(query, data, options = { new: true, runValidators: true }) {
    return await this.model.findOneAndUpdate(query, data, options);
  }

  async findOneAndDelete(query) {
    return await this.model.findOneAndDelete(query);
  }

  async bulkWrite(ops) {
    return await this.model.bulkWrite(ops);
  }

  async updateById(id, data) {
    return await this.model.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  }

  async deleteById(id) {
    return await this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseRepository;
