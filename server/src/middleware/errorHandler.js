const ApiError = require('../utils/ApiError');
const { sendError } = require('../utils/response');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, _req, res, _next) {
  let error = err;

  if (error instanceof ApiError) {
    return sendError(res, error.statusCode, error.message, error.details);
  }

  // Mongoose errors
  if (error.name === 'ValidationError') {
    const details = Object.values(error.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return sendError(res, 400, 'Validation failed', details);
  }

  if (error.name === 'CastError') {
    return sendError(res, 400, `Invalid value for "${error.path}".`);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return sendError(res, 409, `A record with this ${field} already exists.`);
  }

  // Body parse errors
  if (error.type === 'entity.parse.failed' || error.type === 'entity.too.large') {
    return sendError(res, 400, 'Invalid or too large request body.');
  }

  // Object storage / upload errors
  if (error.$metadata || error.name === 'S3ServiceException' || error.http_code === 400) {
    return sendError(res, 400, 'Image upload failed. Please try a different image.');
  }

  console.error('[error]', '\n', error.stack || error);
  return sendError(res, 500, 'Something went wrong on the server.');
}

module.exports = { notFoundHandler, errorHandler };