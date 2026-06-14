const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');

class UserService {
  async getAllUsers(query) {
    return await userRepository.find(query);
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }
    return user;
  }

  async createUser(userData) {
    const existingUser = await userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email is already in use', 400);
    }
    return await userRepository.create(userData);
  }

  async updateUser(id, updateData) {
    const user = await userRepository.updateById(id, updateData);
    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }
    return user;
  }

  async deleteUser(id) {
    const user = await userRepository.deleteById(id);
    if (!user) {
      throw new AppError('No user found with that ID', 404);
    }
    return user;
  }
}

module.exports = new UserService();
