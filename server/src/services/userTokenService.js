const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Customer session cookie — kept separate from the admin cookie so an admin
// and a shopper can be signed in independently in the same browser.
const COOKIE_NAME = 'tcs_user_token';

function signToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: 'user', email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function buildCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  };
}

function setAuthCookie(res, token) {
  res.cookie(COOKIE_NAME, token, buildCookieOptions());
}

function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { ...buildCookieOptions(), maxAge: 0 });
}

module.exports = {
  COOKIE_NAME,
  signToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
