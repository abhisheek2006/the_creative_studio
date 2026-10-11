const Order = require('../models/Order');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, sendError } = require('../utils/response');
const {
  generateOrderReference,
  generateCheckoutRequestId,
} = require('../utils/reference');
const { normalizeWhatsApp } = require('../utils/sanitize');

function isObjectId(v) {
  return /^[0-9a-fA-F]{24}$/.test(String(v || ''));
}

// Loads fresh product snapshots, validates availability and recomputes prices.
async function buildValidatedItems(itemsRaw) {
  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    throw ApiError.badRequest('Your order must contain at least one item.');
  }
  if (itemsRaw.length > 100) throw ApiError.badRequest('Too many items in a single order.');

  const items = itemsRaw.map((it) => ({
    ref: String(it.productId || it.slug || '').trim(),
    quantity: it.quantity,
    variations: it.variations && typeof it.variations === 'object' ? it.variations : {},
  }));

  const refs = items.map((i) => i.ref);
  if (refs.some((r) => !r)) throw ApiError.badRequest('Each item needs a productId or slug.');

  const idRefs = refs.filter(isObjectId);
  const slugRefs = refs.filter((r) => !isObjectId(r));

  const query = {
    status: 'active',
    $or: [
      { _id: { $in: idRefs } },
      { slug: { $in: slugRefs } },
    ],
  };
  const products = await Product.find(query).lean();

  const byKey = new Map();
  products.forEach((p) => {
    byKey.set(String(p._id), p);
    byKey.set(p.slug, p);
  });

  const validated = [];
  let subtotal = 0;
  let anyOutOfStock = false;
  const messages = [];

  for (const it of items) {
    const product = byKey.get(it.ref);
    if (!product) {
      throw ApiError.badRequest(`Product "${it.ref}" is no longer available. Please refresh your cart.`);
    }
    const qty = parseInt(it.quantity, 10);
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      throw ApiError.badRequest(`Invalid quantity for "${product.name}".`);
    }
    if (product.stockQuantity <= 0) {
      anyOutOfStock = true;
      messages.push(`"${product.name}" is currently out of stock.`);
    }
    if (product.stockQuantity > 0 && qty > product.stockQuantity) {
      messages.push(`Only ${product.stockQuantity} left of "${product.name}". Please reduce the quantity.`);
    }
    const unitPrice = product.salePrice != null ? product.salePrice : product.price;
    const lineSubtotal = unitPrice * qty;
    subtotal += lineSubtotal;
    const primary = (product.images || []).find((img) => img.isPrimary) || (product.images || [])[0];
    validated.push({
      product: product._id,
      name: product.name,
      slug: product.slug,
      image: primary ? primary.url : '',
      variations: it.variations,
      unitPrice,
      quantity: qty,
      lineSubtotal,
    });
  }

  if (anyOutOfStock) {
    throw ApiError.badRequest(messages.join(' '), { outOfStock: messages });
  }
  return { validated, subtotal };
}

exports.createOrder = asyncHandler(async (req, res) => {
  const body = req.body || {};

  const customerName = String(body.customerName || '').trim();
  const customerWhatsApp = normalizeWhatsApp(body.customerWhatsApp);
  const customerEmail = String(body.customerEmail || '').trim();
  const deliveryAddress = String(body.deliveryAddress || '').trim();
  const deliveryMethod = body.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';

  if (customerName.length < 2) throw ApiError.badRequest('Please enter your name.');
  if (customerWhatsApp.length < 8) throw ApiError.badRequest('Please enter a valid WhatsApp number.');
  if (deliveryMethod === 'delivery' && deliveryAddress.length < 5) {
    throw ApiError.badRequest('Please enter your delivery address.');
  }

  // Idempotency: repeated submissions reuse the checkoutRequestId if one is supplied.
  const existingRequestId = String(body.checkoutRequestId || '').trim();
  if (existingRequestId) {
    const existing = await Order.findOne({ checkoutRequestId: existingRequestId }).lean();
    if (existing) {
      return sendSuccess(
        res,
        {
          orderReference: existing.orderReference,
          checkoutRequestId: existing.checkoutRequestId,
          alreadySubmitted: true,
          items: existing.items,
          subtotal: existing.subtotal,
          deliveryFee: existing.deliveryFee,
          deliveryFeePending: existing.deliveryFeePending,
          discount: existing.discount,
          total: existing.total,
          status: existing.status,
        },
        200,
        'This order request was already received. You can reuse the WhatsApp message below.'
      );
    }
  }

  const checkoutRequestId = existingRequestId || generateCheckoutRequestId();
  const { validated, subtotal } = await buildValidatedItems(body.items);

  const settings = await SiteSettings.getSingleton();

  // Delivery fee: use configured default when available; otherwise mark pending.
  let deliveryFee = null;
  let deliveryFeePending = true;
  if (deliveryMethod === 'pickup') {
    deliveryFee = 0;
    deliveryFeePending = false;
  } else if (settings.defaultDeliveryFee != null) {
    if (
      settings.freeDeliveryThreshold != null &&
      subtotal >= settings.freeDeliveryThreshold
    ) {
      deliveryFee = 0;
    } else {
      deliveryFee = settings.defaultDeliveryFee;
    }
    deliveryFeePending = false;
  }

  const discount = 0;
  const total = deliveryFee != null ? subtotal + deliveryFee : subtotal;

  const orderReference = generateOrderReference();
  const order = await Order.create({
    orderReference,
    checkoutRequestId,
    customerName,
    customerWhatsApp,
    customerEmail,
    deliveryAddress,
    deliveryMethod,
    items: validated,
    subtotal,
    deliveryFee,
    deliveryFeePending,
    discount,
    total,
    currency: settings.currency || 'INR',
    status: 'pending_confirmation',
  });

  return sendSuccess(
    res,
    {
      orderReference,
      checkoutRequestId,
      alreadySubmitted: false,
      items: order.items,
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      deliveryFeePending: order.deliveryFeePending,
      discount: order.discount,
      total: order.total,
      status: order.status,
      whatsappNumber: settings.whatsappNumber,
    },
    201,
    'Your order request has been saved. Please review and send the WhatsApp message to confirm.'
  );
});

exports.getOrderByReference = asyncHandler(async (req, res) => {
  const reference = String(req.params.reference || '').trim().toUpperCase();
  // Limiting regex risk: reference format is strict.
  if (!/^TCS-\d{8}-[A-Z2-9]{6}$/.test(reference)) {
    throw ApiError.badRequest('Invalid order reference format.');
  }
  const order = await Order.findOne({ orderReference: reference }).lean();
  if (!order) throw ApiError.notFound('No order found with that reference.');

  // Expose only the minimum info a customer needs.
  return sendSuccess(res, {
    orderReference: order.orderReference,
    status: order.status,
    createdAt: order.createdAt,
    items: order.items,
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    deliveryFeePending: order.deliveryFeePending,
    total: order.total,
  });
});

module.exports.buildValidatedItems = buildValidatedItems;