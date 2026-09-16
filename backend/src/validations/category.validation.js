const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createCategory = {
  body: Joi.object().keys({
    name: Joi.alternatives().try(
      Joi.string().trim().min(2).max(100).required(),
      Joi.object().keys({
        vi: Joi.string().trim().required(),
        en: Joi.string().trim().required()
      })
    ).required().messages({
      'any.required': 'Tên danh mục là trường bắt buộc'
    }),
    description: Joi.alternatives().try(
      Joi.string().allow('', null),
      Joi.object().keys({
        vi: Joi.string().allow('', null),
        en: Joi.string().allow('', null)
      })
    ),
    icon: Joi.string().allow('', null)
  })
};

const updateCategory = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    name: Joi.alternatives().try(
      Joi.string().trim().min(2).max(100),
      Joi.object().keys({
        vi: Joi.string().trim(),
        en: Joi.string().trim()
      })
    ),
    description: Joi.alternatives().try(
      Joi.string().allow('', null),
      Joi.object().keys({
        vi: Joi.string().allow('', null),
        en: Joi.string().allow('', null)
      })
    ),
    icon: Joi.string().allow('', null)
  })
};

const categoryIdParam = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  })
};

module.exports = {
  createCategory,
  updateCategory,
  categoryIdParam
};
