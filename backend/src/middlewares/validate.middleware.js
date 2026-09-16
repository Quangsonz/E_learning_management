const Joi = require('joi');
const AppError = require('../utils/appError');

/**
 * Middleware validating request against Joi schema
 * Supports schema objects with: { params, query, body }
 * Express 5 compatible (mutates req.query in-place)
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = {};
  const objectToValidate = {};

  ['params', 'query', 'body'].forEach((key) => {
    if (schema[key]) {
      validSchema[key] = schema[key];
      objectToValidate[key] = req[key];
    }
  });

  const joiSchema = Joi.object(validSchema);
  const { value, error } = joiSchema.validate(objectToValidate, {
    abortEarly: false,
    stripUnknown: false, // Do not strip unexpected fields silently unless specified in schema
    allowUnknown: true
  });

  if (error) {
    const errorDetails = error.details.map((detail) => ({
      field: detail.path.join('.').replace(/^(body|query|params)\./, ''),
      message: detail.message.replace(/['"]/g, '')
    }));

    const errorMessages = errorDetails.map((item) => `${item.field}: ${item.message}`).join('; ');
    const appError = new AppError(`Dữ liệu không hợp lệ: ${errorMessages}`, 400, 'VALIDATION_ERROR');
    appError.details = errorDetails;
    return next(appError);
  }

  // Update validated/coerced values safely
  if (value.body) {
    req.body = value.body;
  }
  if (value.params) {
    Object.assign(req.params, value.params);
  }
  if (value.query) {
    for (const key of Object.keys(req.query)) {
      if (!(key in value.query)) {
        delete req.query[key];
      }
    }
    Object.assign(req.query, value.query);
  }

  next();
};

module.exports = validate;
