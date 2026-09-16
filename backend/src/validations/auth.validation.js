const Joi = require('joi');
const { password } = require('./custom.validation');

const register = {
  body: Joi.object().keys({
    name: Joi.string().trim().min(2).max(100).required().messages({
      'string.empty': 'Họ tên không được để trống',
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được vượt quá 100 ký tự',
      'any.required': 'Họ tên là trường bắt buộc'
    }),
    email: Joi.string().trim().email().required().messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là trường bắt buộc'
    }),
    password: Joi.string().required().custom(password).messages({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là trường bắt buộc'
    }),
    role: Joi.string().valid('student', 'teacher').default('student')
  })
};

const login = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là trường bắt buộc'
    }),
    password: Joi.string().required().messages({
      'string.empty': 'Mật khẩu không được để trống',
      'any.required': 'Mật khẩu là trường bắt buộc'
    })
  })
};

const forgotPassword = {
  body: Joi.object().keys({
    email: Joi.string().trim().email().required().messages({
      'string.empty': 'Email không được để trống',
      'string.email': 'Email không đúng định dạng',
      'any.required': 'Email là trường bắt buộc'
    })
  })
};

const resetPassword = {
  params: Joi.object().keys({
    token: Joi.string().required().messages({
      'any.required': 'Token đặt lại mật khẩu là bắt buộc'
    })
  }),
  body: Joi.object().keys({
    password: Joi.string().required().custom(password).messages({
      'string.empty': 'Mật khẩu mới không được để trống',
      'any.required': 'Mật khẩu mới là trường bắt buộc'
    })
  })
};

const verifyEmail = {
  params: Joi.object().keys({
    token: Joi.string().required().messages({
      'any.required': 'Token xác minh là bắt buộc'
    })
  })
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail
};
