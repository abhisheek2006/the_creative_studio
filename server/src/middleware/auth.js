const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME, verifyToken } = require('../services/tokenService');

function extractToken(req) {
  const fromCookie = req.cookies && req.cookies[COOKIE_NAME];
  if (fromCookie) return fromCookie;
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

// Guarantees req.admin is a valid, active admin account.
const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized('You must be logged in.');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid session. Please log in again.');
  }

  const admin = await Admin.findById(payload.sub);
  if (!admin || !admin.isActive) {
    throw ApiError.unauthorized('This account is no longer active.');
  }

  req.admin = admin;
  next();
});

const requireRole = (...roles) => (req, _res, next) => {
  if (!req.admin || !roles.includes(req.admin.role)) {
    throw ApiError.forbidden('You do not have permission to perform this action.');
  }
  next();
};

// Attach admin if token is present and valid; never throws.
async function attachAdminIfAny(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const payload = verifyToken(token);
      const admin = await Admin.findById(payload.sub);
      if (admin && admin.isActive) req.admin = admin;
    }
  } catch (_err) {
    // Ignore invalid tokens on public routes.
  }
  next();
}

module.exports = { requireAuth, requireRole, attachAdminIfAny };