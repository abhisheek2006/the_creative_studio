const mongoose = require('mongoose');

const CUSTOM_ORDER_STATUSES = [
  'pending_confirmation',
  'in_review',
  'quoted',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled',
];

const customOrderSchema = new mongoose.Schema(
  {
    referenceNumber: { type: String, required: true, unique: true, index: true },
    customerName: { type: String, required: true, trim: true, maxlength: 160 },
    whatsappNumber: { type: String, required: true, trim: true, maxlength: 32 },
    email: { type: String, default: '', trim: true, lowercase: true },
    productType: { type: String, required: true, trim: true, maxlength: 160 },
    occasion: { type: String, default: '', trim: true, maxlength: 160 },
    preferredColor: { type: String, default: '', trim: true, maxlength: 160 },
    budget: { type: Number, default: null, min: 0 },
    quantity: { type: Number, default: 1, min: 1 },
    requiredDate: { type: Date, default: null },
    customizationDetails: { type: String, required: true, trim: true, maxlength: 4000 },
    referenceImageUrl: { type: String, default: '' },
    referenceImagePublicId: { type: String, default: '' },
    status: {
      type: String,
      enum: CUSTOM_ORDER_STATUSES,
      default: 'pending_confirmation',
      index: true,
    },
    adminNotes: { type: String, default: '', trim: true, maxlength: 4000 },
  },
  { timestamps: true }
);

customOrderSchema.index({ createdAt: -1 });

customOrderSchema.statics.CUSTOM_ORDER_STATUSES = CUSTOM_ORDER_STATUSES;

module.exports = mongoose.model('CustomOrder', customOrderSchema);
module.exports.CUSTOM_ORDER_STATUSES = CUSTOM_ORDER_STATUSES;
