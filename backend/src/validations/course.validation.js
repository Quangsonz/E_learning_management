const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCourse = {
  body: Joi.object().keys({
    title: Joi.string().trim().min(3).max(200).required().messages({
      'string.empty': 'Tiêu đề khóa học không được để trống',
      'string.min': 'Tiêu đề khóa học phải có ít nhất 3 ký tự',
      'string.max': 'Tiêu đề khóa học không được vượt quá 200 ký tự',
      'any.required': 'Tiêu đề khóa học là trường bắt buộc'
    }),
    description: Joi.string().allow('', null),
    category: Joi.string().custom(objectId).messages({
      'any.invalid': 'Danh mục phải là ObjectId hợp lệ'
    }),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all').default('all'),
    price: Joi.number().min(0).default(0),
    estimatedPrice: Joi.number().min(0),
    discountPercentage: Joi.number().min(0).max(100),
    thumbnail: Joi.string().allow('', null),
    tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    requirements: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    whatYouWillLearn: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    instructor: Joi.string().custom(objectId)
  })
};

const updateCourse = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    title: Joi.string().trim().min(3).max(200),
    description: Joi.string().allow('', null),
    category: Joi.string().custom(objectId),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all'),
    price: Joi.number().min(0),
    estimatedPrice: Joi.number().min(0),
    discountPercentage: Joi.number().min(0).max(100),
    thumbnail: Joi.string().allow('', null),
    tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    requirements: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    whatYouWillLearn: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
    status: Joi.string().valid('draft', 'published'),
    instructor: Joi.string().custom(objectId)
  })
};

const getCourse = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  })
};

const queryCourses = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    search: Joi.string().max(200).allow('', null),
    category: Joi.string().allow('', null),
    status: Joi.string().valid('draft', 'published', 'all'),
    level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all'),
    priceType: Joi.string().valid('free', 'paid'),
    minRating: Joi.number().min(0).max(5),
    sort: Joi.string(),
    instructor: Joi.string()
  })
};

const approveCourse = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('published', 'draft').required().messages({
      'any.required': 'Trạng thái xét duyệt (status) là trường bắt buộc',
      'any.only': 'Trạng thái chỉ có thể là published hoặc draft'
    })
  })
};

module.exports = {
  createCourse,
  updateCourse,
  getCourse,
  queryCourses,
  approveCourse
};
