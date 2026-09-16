const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const compression = require('compression');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/error.middleware');
const { requestFilter, handleJsonSyntaxError } = require('./middlewares/requestFilter.middleware');
const { sanitizeInput } = require('./middlewares/sanitize.middleware');
const { dynamicLimiter } = require('./middlewares/rateLimiter.middleware');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');

const app = express();

// 1. Security HTTP headers & compression
app.use(helmet());
app.use(compression());

// 2. Enable CORS for all requests (including preflight and early errors)
app.use(cors());

// 3. Request filtering (URL length check, Content-Type check, pagination limits)
app.use(requestFilter);

// 4. Global Dynamic Rate Limiting across all API endpoints
app.use('/api', dynamicLimiter);

// 5. Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 6. STRIPE WEBHOOK (Must be before express.json body parser)
const paymentController = require('./controllers/payment.controller');
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

// 7. Body parser with strict size limit (50kb limit)
app.use(express.json({ limit: '50kb' }));
// Catch malformed JSON syntax immediately
app.use(handleJsonSyntaxError);
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// 8. Sanitize all user inputs (In-place NoSQL injection protection, XSS cleaning, trimming)
app.use(sanitizeInput);

// 9. API ROUTES
app.use('/api', routes);

// 10. SWAGGER API DOCUMENTATION
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'E-Learning API Docs',
    customCss: '.swagger-ui .topbar { background-color: #6366f1; }'
  })
);

// 11. UNHANDLED ROUTES
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 12. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
