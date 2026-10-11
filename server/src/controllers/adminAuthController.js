const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require('../services/tokenService');

exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) throw ApiError.badRequest('Email and password are required.');

  const admin = await Admin.findOne({ email }).select('+passwordHash');
  if (!admin || !admin.isActive) throw ApiError.unauthorized('Invalid credentials.');

  const ok = await admin.verifyPassword(password);
  if (!ok) throw ApiError.unauthorized('Invalid credentials.');

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);
  setAuthCookie(res, token);

  return sendSuccess(res, { admin: admin.toSafeJSON(), token }, 200, 'Login successful.');
});

exports.logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, null, 200, 'Logged out.');
});

exports.me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { admin: req.admin.toSafeJSON() });
});