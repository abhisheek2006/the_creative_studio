const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { isFirebaseConfigured, verifyIdToken } = require('../config/firebase');
const {
  signToken,
  setAuthCookie,
  clearAuthCookie,
} = require('../services/userTokenService');

// Sign in (or silently create) a customer account from a Firebase Google ID token.
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
  if (decoded.email_verified === false) {
    throw ApiError.unauthorized('Please verify your Google email address first.');
  }

  const name = String(decoded.name || '').trim() || email.split('@')[0];
  const photoUrl = String(decoded.picture || '').trim();

  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      email,
      photoUrl,
      firebaseUid: decoded.uid || '',
      provider: 'google',
      lastLoginAt: new Date(),
    });
  } else {
    if (!user.isActive) throw ApiError.forbidden('This account has been disabled.');
    user.name = user.name || name;
    if (photoUrl) user.photoUrl = photoUrl;
    if (!user.firebaseUid && decoded.uid) user.firebaseUid = decoded.uid;
    user.lastLoginAt = new Date();
    await user.save();
  }

  const token = signToken(user);
  setAuthCookie(res, token);

  return sendSuccess(res, { user: user.toSafeJSON(), token }, 200, 'Signed in with Google.');
});

exports.logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return sendSuccess(res, null, 200, 'Signed out.');
});

exports.me = asyncHandler(async (req, res) => {
  return sendSuccess(res, { user: req.user.toSafeJSON() });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  if (name !== undefined) {
    const clean = String(name).trim();
    if (clean.length < 2) throw ApiError.badRequest('Please enter your name.');
    req.user.name = clean.slice(0, 120);
  }
  if (phone !== undefined) {
    req.user.phone = String(phone).trim().slice(0, 32);
  }

  await req.user.save();
  return sendSuccess(res, { user: req.user.toSafeJSON() }, 200, 'Profile updated.');
});
