const CustomOrder = require('../models/CustomOrder');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { escapeRegex } = require('../utils/sanitize');

exports.listCustomOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 15, maxLimit: 100 });
  const { search, status } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (search) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { referenceNumber: { $regex: term, $options: 'i' } },
      { customerName: { $regex: term, $options: 'i' } },
      { whatsappNumber: { $regex: term.replace(/\s/g, ''), $options: 'i' } },
      { productType: { $regex: term, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    CustomOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CustomOrder.countDocuments(filter),
  ]);

  return sendSuccess(res, { customOrders: items, pagination: buildPaginated(items, total, page, limit).pagination });
});

exports.getCustomOrder = asyncHandler(async (req, res) => {
  const item = await CustomOrder.findById(req.params.id).lean();
  if (!item) throw ApiError.notFound('Custom order request not found.');
  return sendSuccess(res, { customOrder: item });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!CustomOrder.CUSTOM_ORDER_STATUSES.includes(String(status))) {
    throw ApiError.badRequest('Invalid status.');
  }
  const item = await CustomOrder.findById(req.params.id);
  if (!item) throw ApiError.notFound('Custom order request not found.');
  item.status = status;
  await item.save();
  return sendSuccess(res, { customOrder: item }, 200, 'Status updated.');
});

exports.updateNotes = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body || {};
  const item = await CustomOrder.findById(req.params.id);
  if (!item) throw ApiError.notFound('Custom order request not found.');
  item.adminNotes = String(adminNotes || '').trim().slice(0, 4000);
  await item.save();
  return sendSuccess(res, { customOrder: item }, 200, 'Notes saved.');
});