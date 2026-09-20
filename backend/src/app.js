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

// Trust reverse proxy (Required for Render, Heroku, Cloudflare to obtain real client IP)
app.set('trust proxy', 1);

// 1. Security HTTP headers & compression
app.use(helmet());
app.use(compression());

// 2. Enable CORS with proper origin check for Production (Vercel) & Localhost
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Cho phép requests không có origin (curl, mobile apps, server-to-server, Render health check)
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.some((allowed) => {
      const cleanAllowed = allowed.replace(/\/$/, '');
      const cleanOrigin = origin.replace(/\/$/, '');
      return cleanOrigin === cleanAllowed;
    });

    if (
      isExplicitlyAllowed ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Root & Health Check Endpoints (Đặt trước rate limiter)
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'E-Learning Backend API is running smoothly',
    docs: '/api-docs',
    health: '/health'
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development'
  });
});

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
