const Joi = require('joi');

const globalSearch = {
  query: Joi.object().keys({
    q: Joi.string().trim().max(200).allow('', null).messages({
      'string.max': 'Từ khóa tìm kiếm không được vượt quá 200 ký tự'
    }),
    type: Joi.string()
      .valid('all', 'courses', 'lessons', 'categories', 'instructors', 'users', 'orders', 'applications')
      .default('all'),
    limit: Joi.number().integer().min(1).max(100).default(6)
  })
};

module.exports = {
  globalSearch
};
