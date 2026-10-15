const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createQROrder = {
  body: Joi.object().keys({
    courseId: Joi.string().custom(objectId).required(),
  }),
};

const getOrderStatus = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

const confirmTransfer = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    transactionReference: Joi.string().trim().max(100).allow('', null),
  }),
};

const adminVerifyOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    bankTransactionId: Joi.string().trim().max(100).allow('', null),
    adminNote: Joi.string().trim().max(500).allow('', null),
  }),
};

const adminRejectOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string().trim().max(500).required(),
  }),
};

const demoSimulatePayment = {
  body: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createQROrder,
  getOrderStatus,
  confirmTransfer,
  adminVerifyOrder,
  adminRejectOrder,
  demoSimulatePayment,
};
