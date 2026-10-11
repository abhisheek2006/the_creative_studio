const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { escapeRegex } = require('../utils/sanitize');

exports.listMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 15, maxLimit: 100 });
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { email: { $regex: term, $options: 'i' } },
      { subject: { $regex: term, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);

  return sendSuccess(res, { messages: items, pagination: buildPaginated(items, total, page, limit).pagination });
});

exports.getMessage = asyncHandler(async (req, res) => {
  const item = await ContactMessage.findById(req.params.id).lean();
  if (!item) throw ApiError.notFound('Message not found.');
  return sendSuccess(res, { message: item });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body || {};
  if (!['new', 'read', 'replied', 'archived'].includes(String(status))) {
    throw ApiError.badRequest('Invalid status.');
  }
  const item = await ContactMessage.findById(req.params.id);
  if (!item) throw ApiError.notFound('Message not found.');
  item.status = status;
  if (adminNotes !== undefined) item.adminNotes = String(adminNotes || '').trim().slice(0, 2000);
  await item.save();
  return sendSuccess(res, { message: item }, 200, 'Message updated.');
});