const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createModule = {
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
      'string.empty': 'Tiêu đề chương học không được để trống',
      'string.min': 'Tiêu đề chương học phải có ít nhất 2 ký tự',
      'string.max': 'Tiêu đề chương học không được vượt quá 200 ký tự',
      'any.required': 'Tiêu đề chương học là trường bắt buộc'
    }),
    description: Joi.alternatives().try(
      Joi.string().allow('', null),
      Joi.object({
        vi: Joi.string().allow('', null),
        en: Joi.string().allow('', null)
      })
    ),
    order: Joi.number().integer().min(0)
  })
};

const updateModule = {
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
    description: Joi.alternatives().try(
      Joi.string().allow('', null),
      Joi.object({
        vi: Joi.string().allow('', null),
        en: Joi.string().allow('', null)
      })
    ),
    order: Joi.number().integer().min(0)
  })
};

const getModule = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
    courseId: Joi.string().custom(objectId)
  })
};

const deleteModule = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId),
    courseId: Joi.string().custom(objectId)
  }),
  query: Joi.object().keys({
    cascade: Joi.boolean().default(false)
  })
};

const reorderModules = {
  params: Joi.object().keys({
    courseId: Joi.string().custom(objectId)
  }),
  body: Joi.object().keys({
    modules: Joi.array()
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
  createModule,
  updateModule,
  getModule,
  deleteModule,
  reorderModules
};
