function sendSuccess(res, data = null, statusCode = 200, message = undefined) {
  const body = { success: true };
  if (message) body.message = message;
  body.data = data;
  return res.status(statusCode).json(body);
}

function sendError(res, statusCode, message, details = undefined) {
  const body = { success: false, message: message || 'Something went wrong' };
  if (details) body.details = details;
  return res.status(statusCode).json(body);
}

function getPagination(query, defaults = { page: 1, limit: 12, maxLimit: 100 }) {
  const page = Math.max(parseInt(query.page, 10) || defaults.page, 1);
  const rawLimit = parseInt(query.limit, 10) || defaults.limit;
  const limit = Math.min(Math.max(rawLimit, 1), defaults.maxLimit);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildPaginated(items, total, page, limit) {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      hasMore: page * limit < total,
    },
  };
}

module.exports = { sendSuccess, sendError, getPagination, buildPaginated };
