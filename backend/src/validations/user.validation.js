const Joi = require('joi');
const { objectId, password } = require('./custom.validation');

const updateMe = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100),
    avatar: Joi.string().allow('', null)
  })
};

const changePassword = {
  body: Joi.object().keys({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Mật khẩu hiện tại là trường bắt buộc'
    }),
    newPassword: Joi.string().required().custom(password).messages({
      'any.required': 'Mật khẩu mới là trường bắt buộc'
    })
  })
};

const createUser = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'any.required': 'Tên người dùng là trường bắt buộc'
    }),
    email: Joi.string().trim().email().required().messages({
      'any.required': 'Email là trường bắt buộc'
    }),
    password: Joi.string().required().custom(password).messages({
      'any.required': 'Mật khẩu là trường bắt buộc'
    }),
    role: Joi.string().valid('student', 'teacher', 'admin').default('student')
  })
};

const updateUser = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100),
    email: Joi.string().trim().email(),
    role: Joi.string().valid('student', 'teacher', 'admin'),
    isActive: Joi.boolean(),
    avatar: Joi.string().allow('', null)
  })
};

const userIdParam = {
  params: Joi.object().keys({
    id: Joi.string().required().custom(objectId)
  })
};

module.exports = {
  updateMe,
  changePassword,
  createUser,
  updateUser,
  userIdParam
};
