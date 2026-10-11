const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, limit, message) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: message || 'Too many requests. Please try again later.' },
  });

// Login brute-force protection.
const loginLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many login attempts. Please try again in 15 minutes.'
);

// Public forms (contact, custom orders, checkouts, orders).
const publicFormLimiter = createLimiter(
  15 * 60 * 1000,
  30,
  'Too many submissions from this IP. Please try again later.'
);

// General API guard.
const apiLimiter = createLimiter(
  60 * 1000,
  180,
  'Too many requests.'
);

module.exports = { loginLimiter, publicFormLimiter, apiLimiter, createLimiter };