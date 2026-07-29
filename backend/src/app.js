const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./middlewares/error.middleware');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');

const compression = require('compression');

const app = express();
app.use(helmet());
app.use(compression());

const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const isDev = process.env.NODE_ENV === 'development';

// Limit requests from same API
const limiter = rateLimit({
  max: isDev ? 10000 : 1000, // Limit each IP per 15 mins (much higher in dev)
  windowMs: 15 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in 15 minutes!'
});

const adminTeacherLimiter = rateLimit({
  max: isDev ? 50000 : 5000, // Limit each IP per 15 mins for Admins & Teachers
  windowMs: 15 * 60 * 1000,
  message: 'Too many administrative requests from this IP, please try again in 15 minutes!'
});

// Dynamic Rate Limiter based on Role decoded from token
const dynamicLimiter = (req, res, next) => {
  let isAdminOrTeacher = false;
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && ['admin', 'teacher'].includes(decoded.role)) {
        isAdminOrTeacher = true;
      }
    }
  } catch (err) {}

  if (isAdminOrTeacher) {
    return adminTeacherLimiter(req, res, next);
  }
  return limiter(req, res, next);
};

app.use('/api', dynamicLimiter);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 1.5. STRIPE WEBHOOK (Must be before express.json)
const paymentController = require('./controllers/payment.controller');
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.webhook);

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
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. GLOBAL ERROR HANDLER
app.use(globalErrorHandler);

module.exports = app;
