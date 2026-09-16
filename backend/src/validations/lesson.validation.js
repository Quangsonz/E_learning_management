const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createLesson = {
  params: Joi.object().keys({
    courseId: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    title: Joi.alternatives().try(
      Joi.string().trim().min(2).max(200),
      Joi.object({
        vi: Joi.string().trim().min(2).max(200),
        en: Joi.string().trim().min(2).max(200)
      })
    ).required().messages({
      'string.empty': 'Tiêu đề bài học không được để trống',
      'string.min': 'Tiêu đề bài học phải có ít nhất 2 ký tự',
      'string.max': 'Tiêu đề bài học không được vượt quá 200 ký tự',
      'any.required': 'Tiêu đề bài học là trường bắt buộc'
    }),
    content: Joi.string().allow('', null),
    videoUrl: Joi.string().trim().required().messages({
      'string.empty': 'Đường dẫn video không được để trống',
      'any.required': 'Đường dẫn video là trường bắt buộc'
    }),
    videoPublicId: Joi.string().allow('', null),
    provider: Joi.string().valid('cloudinary', 'youtube').allow('', null),
    duration: Joi.number().min(0).default(0),
    isFreePreview: Joi.boolean().default(false),
    order: Joi.number().integer().min(0),
    course: Joi.string().custom(objectId),
    resources: Joi.array().items(Joi.any())
  })
};

const updateLesson = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
    courseId: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    title: Joi.alternatives().try(
      Joi.string().trim().min(2).max(200),
      Joi.object({
        vi: Joi.string().trim().min(2).max(200),
        en: Joi.string().trim().min(2).max(200)
      })
    ),
    content: Joi.string().allow('', null),
    videoUrl: Joi.string().trim().allow('', null),
    videoPublicId: Joi.string().allow('', null),
    provider: Joi.string().valid('cloudinary', 'youtube').allow('', null),
    duration: Joi.number().min(0),
    isFreePreview: Joi.boolean(),
    order: Joi.number().integer().min(0),
    resources: Joi.array().items(Joi.any())
  })
};

const getLesson = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
    courseId: Joi.string().custom(objectId)
  })
};

const reorderLessons = {
  body: Joi.object().keys({
    lessons: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.string().required().custom(objectId),
          order: Joi.number().integer().required()
        })
      )
      .min(1)
      .required()
  })
};

module.exports = {
  createLesson,
  updateLesson,
  getLesson,
  reorderLessons
};
