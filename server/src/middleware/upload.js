const multer = require('multer');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { ALLOWED_MIME } = require('../services/uploadService');

const maxBytes = (env.maxImageMb || 5) * 1024 * 1024;

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(ApiError.badRequest('Only JPG, PNG, WEBP, GIF or AVIF images are allowed.'));
  }
  return cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxBytes, files: 12 },
});

function handleMulterError(err, _req, _res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(ApiError.badRequest(`Image must be ${env.maxImageMb}MB or smaller.`));
    }
    return next(ApiError.badRequest(`Upload error: ${err.message}`));
  }
  if (err && err.statusCode === 400) return next(err);
  return next(err);
}

module.exports = { upload, handleMulterError, maxBytes };