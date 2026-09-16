const Joi = require('joi');
const { objectId } = require('./custom.validation');

const submitQuiz = {
  params: Joi.object().keys({
    quizId: Joi.string().required().custom(objectId)
  }),
  body: Joi.object().keys({
    answers: Joi.array()
      .items(
        Joi.object().keys({
          questionId: Joi.string().required(),
          selectedOption: Joi.alternatives().try(Joi.number(), Joi.string()).required()
        })
      )
      .min(1)
      .required()
      .messages({
        'any.required': 'Danh sách câu trả lời là bắt buộc'
      })
  })
};

const quizIdParam = {
  params: Joi.object().keys({
    quizId: Joi.string().required().custom(objectId)
  })
};

const createQuiz = {
  body: Joi.object().keys({
    title: Joi.string().trim().min(3).max(200).required(),
    course: Joi.string().required().custom(objectId),
    lesson: Joi.string().custom(objectId),
    questions: Joi.array().items(Joi.object()).min(1).required(),
    passingScore: Joi.number().min(0).max(100),
    timeLimitMinutes: Joi.number().min(1)
  })
};

module.exports = {
  submitQuiz,
  quizIdParam,
  createQuiz
};
