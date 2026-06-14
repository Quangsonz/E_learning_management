const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');

const app = express();

// 1. GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Implement CORS
app.use(cors());

// 2. ROUTES
app.use('/api', routes);

// 3. SWAGGER API DOCUMENTATION
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'E-Learning API Docs',
    customCss: '.swagger-ui .topbar { background-color: #6366f1; }'
  })
);

// 3. UNHANDLED ROUTES
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
