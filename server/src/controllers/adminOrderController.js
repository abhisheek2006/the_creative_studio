const Order = require('../models/Order');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { escapeRegex } = require('../utils/sanitize');

const STATUS_QUERY = {
  'pending_confirmation': 'pending_confirmation',
  'confirmed': 'confirmed',
  'processing': 'processing',
  'ready_for_dispatch': 'ready_for_dispatch',
  'shipped': 'shipped',
  'completed': 'completed',
  'cancelled': 'cancelled',
};

exports.listOrders = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 15, maxLimit: 100 });
  const { search, status, from, to } = req.query;

  const filter = {};
  const andClauses = [];

  if (status && STATUS_QUERY[status]) filter.status = status;

  if (search) {
    const term = escapeRegex(search.trim());
    andClauses.push({
      $or: [
        { orderReference: { $regex: term, $options: 'i' } },
        { customerName: { $regex: term, $options: 'i' } },
        { customerWhatsApp: { $regex: term.replace(/\s/g, ''), $options: 'i' } },
      ],
    });
  }

  if (from || to) {
    const dateRange = {};
    if (from) dateRange.$gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setDate(d.getDate() + 1);
      dateRange.$lt = d;
    }
    andClauses.push({ createdAt: dateRange });
  }

  if (andClauses.length) filter.$and = andClauses;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    orders,
    pagination: buildPaginated(orders, total, page, limit).pagination,
  });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) throw ApiError.notFound('Order not found.');
  return sendSuccess(res, { order });
});

exports.updateStatus = asyncHandler(async (req, res) => {
  // Stock handling policy: reserve stock once when moving out of pending_confirmation,
  // and release it if an order returns to pending or is cancelled.
  const { status } = req.body || {};
  if (!Order.ORDER_STATUSES.includes(String(status))) {
    throw ApiError.badRequest('Invalid order status.');
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');

  const wasPending = order.status === 'pending_confirmation';
  const willBePending = status === 'pending_confirmation' || status === 'cancelled';

  if (wasPending && !willBePending) {
    // Confirm the order -> deduct stock (reservation becomes a real deduction).
    await applyStockAdjustment(order, -1);
  } else if (!wasPending && willBePending) {
    // Revert / cancel -> return stock.
    await applyStockAdjustment(order, 1);
  }

  order.status = status;
  await order.save();
  return sendSuccess(res, { order }, 200, `Order marked as ${status.replace(/_/g, ' ')}.`);
});

async function applyStockAdjustment(order, sign) {
  for (const item of order.items) {
    if (!item.product) continue;
    const product = await Product.findById(item.product);
    if (!product) continue;
    const next = product.stockQuantity + sign * item.quantity;
    if (next < 0) {
      throw ApiError.conflict(
        `Cannot update order: "${item.name}" stock would go negative. Stock is ${product.stockQuantity}.`
      );
    }
    product.stockQuantity = next;
    if (sign === -1) product.soldCount = (product.soldCount || 0) + item.quantity;
    else product.soldCount = Math.max((product.soldCount || 0) - item.quantity, 0);
    await product.save();
  }
}

exports.updateNotes = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body || {};
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found.');
  order.adminNotes = String(adminNotes || '').trim().slice(0, 4000);
  await order.save();
  return sendSuccess(res, { order }, 200, 'Notes saved.');
});

exports.exportCsv = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).sort({ createdAt: -1 }).limit(2000).lean();

  const toCsvCell = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = [
    'OrderReference', 'Date', 'CustomerName', 'CustomerWhatsApp', 'Status',
    'ItemCount', 'ItemsSummary', 'Subtotal', 'DeliveryFee', 'DeliveryFeePending', 'Discount', 'Total',
  ].map(toCsvCell).join(',');

  const rows = orders.map((o) =>
    [
      o.orderReference,
      o.createdAt ? o.createdAt.toISOString() : '',
      o.customerName,
      o.customerWhatsApp,
      o.status,
      o.items.length,
      o.items.map((i) => `${i.name} x${i.quantity} (Rs.${i.unitPrice})`).join(' | '),
      o.subtotal,
      o.deliveryFee ?? 'pending',
      o.deliveryFeePending,
      o.discount,
      o.total ?? 'pending',
    ]
      .map(toCsvCell)
      .join(',')
  );

  const csv = `${header}\n${rows.join('\n')}\n`;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="orders-${Date.now()}.csv"`);
  return res.send(csv);
});