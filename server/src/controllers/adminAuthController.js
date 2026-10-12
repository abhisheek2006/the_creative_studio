const Admin = require('../models/Admin');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const env = require('../config/env');
const { isFirebaseConfigured, verifyIdToken } = require('../config/firebase');
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require('../services/tokenService');

exports.login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');

  if (!email || !password) throw ApiError.badRequest('Email and password are required.');

  // Website-config admin (ADMIN_EMAIL + ADMIN_INITIAL_PASSWORD from env) always
  // works. The account is provisioned on first login so the site needs no
  // separate database setup for the admin.
  const envEmail = String(env.admin.email || '').trim().toLowerCase();
  const isEnvAdmin = Boolean(
    envEmail && env.admin.password && email === envEmail && password === env.admin.password
  );

  let admin = await Admin.findOne({ email }).select('+passwordHash');

  if (!admin && isEnvAdmin) {
    admin = await Admin.create({
      name: env.admin.name,
      email,
      passwordHash: await Admin.hashPassword(env.admin.password),
      role: 'admin',
      isActive: true,
    });
  }

  const ok = admin ? await admin.verifyPassword(password) : false;
  if (!admin || !admin.isActive || !ok) throw ApiError.unauthorized('Invalid credentials.');

  admin.lastLoginAt = new Date();
  await admin.save();

  const token = signToken(admin);
  setAuthCookie(res, token);

  return sendSuccess(res, { admin: admin.toSafeJSON(), token }, 200, 'Login successful.');
});

// Sign in authenticated Google accounts whose email matches an active admin
// (or the ADMIN_EMAIL bootstrap email, which is provisioned on first sign-in).
exports.googleLogin = asyncHandler(async (req, res) => {
  const idToken = String(req.body.idToken || '').trim();
  if (!idToken) throw ApiError.badRequest('Google sign-in token is required.');
  if (!isFirebaseConfigured()) {
    throw ApiError.badRequest('Google sign-in is not configured on the server.');
  }

  let decoded;
  try {
    decoded = await verifyIdToken(idToken);
  } catch (_err) {
    throw ApiError.unauthorized('We could not verify your Google sign-in. Please try again.');
  }

  const email = String(decoded.email || '').trim().toLowerCase();
  if (!email) throw ApiError.badRequest('Your Google account did not share an email address.');

  let admin = await Admin.findOne({ email });
  if (!admin) {
    const envEmail = String(env.admin.email || '').trim().toLowerCase();
    if (!envEmail || envEmail !== email) {
      throw ApiError.forbidden('This Google account is not an administrator.');
    }
    // First Google sign-in for the bootstrap admin email — provision the account.
    const name = String(decoded.name || '').trim() || env.admin.name;
    admin = await Admin.create({ name, email, role: 'admin', isActive: true });
  } else if (!admin.isActive) {
    throw ApiError.forbidden('This account is no longer active.');
  }

  admin.lastLoginAt = new Date();
  if (!admin.name && decoded.name) admin.name = String(decoded.name).trim();
  await admin.save();

  const token = signToken(admin);
  setAuthCookie(res, token);

  return sendSuccess(res, { admin: admin.toSafeJSON(), token }, 200, 'Signed in with Google.');
});

exports.logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, null, 200, 'Logged out.');
});

exports.me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { admin: req.admin.toSafeJSON() });
});