const AppError = require('../utils/appError');

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;
    
    // Check for Mongoose specific errors (CastError, ValidationError, etc.)
    if (error.name === 'CastError') error = new AppError(`Invalid ${error.path}: ${error.value}.`, 400);
    if (error.code === 11000) {
      const value = error.message.match(/(["'])(\\?.)*?\1/)[0];
      error = new AppError(`Duplicate field value: ${value}. Please use another value!`, 400);
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(el => el.message);
      error = new AppError(`Invalid input data. ${errors.join('. ')}`, 400);
    }

    sendErrorProd(error, res);
  }
};
