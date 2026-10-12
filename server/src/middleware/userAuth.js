const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME, verifyToken } = require('../services/userTokenService');

function extractToken(req) {
  const fromCookie = req.cookies && req.cookies[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

// Guarantees req.user is a valid, active customer account.
const requireUser = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('You must be signed in.');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Your session has expired. Please sign in again.');
    }
    throw ApiError.unauthorized('Invalid session. Please sign in again.');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('This account is no longer active.');
  }

  req.user = user;
  next();
});

module.exports = { requireUser };
