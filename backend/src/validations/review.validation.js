const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createReview = {
  params: Joi.object().keys({
    courseId: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5).required().messages({
      'number.base': 'Đánh giá phải là số nguyên từ 1 đến 5',
      'number.min': 'Đánh giá tối thiểu là 1 sao',
      'number.max': 'Đánh giá tối đa là 5 sao',
      'any.required': 'Số sao đánh giá là bắt buộc'
    }),
    comment: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Nội dung đánh giá không được để trống',
      'string.max': 'Nội dung đánh giá không được vượt quá 1000 ký tự',
      'any.required': 'Nội dung đánh giá là bắt buộc'
    })
  })
};

const getCourseReviews = {
  params: Joi.object().keys({
    courseId: Joi.string().required().custom(objectId)
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    skip: Joi.number().integer().min(0),
    sort: Joi.string().valid('createdAt', '-createdAt', 'rating', '-rating')
  })
};

const replyToReview = {
  params: Joi.object().keys({
    courseId: Joi.string().required().custom(objectId),
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    replyText: Joi.string().trim().min(1).max(1000).required().messages({
      'string.empty': 'Nội dung phản hồi không được để trống',
      'string.max': 'Nội dung phản hồi không được vượt quá 1000 ký tự',
      'any.required': 'Nội dung phản hồi là bắt buộc'
    })
  })
};

const updateReview = {
  params: Joi.object().keys({
    courseId: Joi.string().required().custom(objectId),
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().trim().min(1).max(1000),
    reviewText: Joi.string().trim().min(1).max(1000)
  }).min(1)
};

const deleteReview = {
  params: Joi.object().keys({
    courseId: Joi.string().required().custom(objectId),
    id: Joi.string().required().custom(objectId)
  })
};

module.exports = {
  createReview,
  getCourseReviews,
  replyToReview,
  updateReview,
  deleteReview
};
