const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');
const { validationResult } = require('express-validator');

function runValidation(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();
  const details = errors.array().map((e) => ({ field: e.param, message: e.msg }));
  return next(ApiError.badRequest('Validation failed', details));
}

// Express-validator validators that coerce optional empty strings to null.
const optionalString = () => ({
  validator: (value) => value !== undefined && value !== null && String(value).trim() !== '',
});

// Lightweight request-body estimators for rate limiting (not a security boundary).
function bodyBytes(req) {
  return Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

module.exports = { runValidation, optionalString, bodyBytes, isValidObjectId, validationResult };