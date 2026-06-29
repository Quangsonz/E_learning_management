const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { protect: auth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Webhook needs raw body parsing, not JSON
// This usually goes before the global express.json() middleware, but we can do it locally if needed
// For simplicity in MVP, if global json is already applied in server.js, we might have to bypass it.
// The proper way is to configure this route to use express.raw() in server.js.

router.post('/create-payment-intent', auth, paymentController.createPaymentIntent);

module.exports = router;
