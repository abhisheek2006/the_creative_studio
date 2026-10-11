const mongoose = require('mongoose');

const ORDER_STATUSES = [
  'pending_confirmation',
  'confirmed',
  'processing',
  'ready_for_dispatch',
  'shipped',
  'completed',
  'cancelled',
];

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    // Snapshot so historical orders survive product edits/removal.
    name: { type: String, required: true, trim: true },
    slug: { type: String, default: '' },
    image: { type: String, default: '' },
    variations: { type: mongoose.Schema.Types.Mixed, default: {} },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' },
    },
    lineSubtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderReference: { type: String, required: true, unique: true, index: true },
    checkoutRequestId: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    customerWhatsApp: { type: String, required: true, trim: true, maxlength: 32 },
    customerEmail: { type: String, default: '', trim: true, lowercase: true },
    deliveryAddress: { type: String, default: '', trim: true, maxlength: 1000 },
    deliveryMethod: {
      type: String,
      enum: ['delivery', 'pickup'],
      default: 'delivery',
    },
    items: {
      type: [orderItemSchema],
      validate: [(v) => Array.isArray(v) && v.length > 0, 'Order must contain at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, default: null, min: 0 },
    deliveryFeePending: { type: Boolean, default: true },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: null, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: 'pending_confirmation',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['not_applicable', 'pending', 'paid', 'refunded'],
      default: 'not_applicable',
    },
    adminNotes: { type: String, default: '', trim: true, maxlength: 4000 },
    source: { type: String, default: 'whatsapp' },
    whatsappSentConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerWhatsApp: 1 });

orderSchema.statics.ORDER_STATUSES = ORDER_STATUSES;

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
