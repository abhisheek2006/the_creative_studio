const mongoose = require('mongoose');
const slugify = require('slugify');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, default: '' },
    alt: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: true }
);

const variationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
    sku: { type: String, default: '', trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    shortDescription: { type: String, default: '', trim: true, maxlength: 400 },
    description: { type: String, default: '', trim: true, maxlength: 20000 },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
      validate: { validator: Number.isFinite, message: 'Price must be a number' },
    },
    salePrice: {
      type: Number,
      default: null,
      min: [0, 'Sale price cannot be negative'],
      validate: {
        validator(value) {
          if (value === null || value === undefined || value === '') return true;
          return Number.isFinite(value) && value <= this.price;
        },
        message: 'Sale price must be less than or equal to the regular price',
      },
    },
    stockQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Stock cannot be negative'],
    },
    images: { type: [imageSchema], default: [] },
    variations: { type: [variationSchema], default: [] },
    colors: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    customizable: { type: Boolean, default: false },
    customizationInstructions: { type: String, default: '', trim: true, maxlength: 4000 },
    specifications: { type: [specificationSchema], default: [] },
    deliveryInformation: { type: String, default: '', trim: true, maxlength: 2000 },
    isFeatured: { type: Boolean, default: false, index: true },
    isBestSeller: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['active', 'inactive', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    soldCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', shortDescription: 'text', description: 'text' });
productSchema.index({ createdAt: -1 });
productSchema.index({ price: 1 });

productSchema.pre('validate', function ensureSlugAndSalePrice(next) {
  if (this.salePrice === undefined) this.salePrice = null;
  if (this.salePrice === '' ) this.salePrice = null;
  if (this.stockQuantity === undefined || this.stockQuantity === null) this.stockQuantity = 0;
  next();
});

productSchema.virtual('effectivePrice').get(function effectivePrice() {
  if (this.salePrice !== null && this.salePrice !== undefined) return this.salePrice;
  return this.price;
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (this.salePrice !== null && this.salePrice !== undefined && this.price > 0) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

productSchema.statics.buildUniqueSlug = async function buildUniqueSlug(name, excludeId = null) {
  const base = slugify(String(name || 'product'), { lower: true, strict: true }) || 'product';
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug };
    if (excludeId) query._id = { $ne: excludeId };
    const existing = await this.findOne(query).select('_id').lean();
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
};

module.exports = mongoose.model('Product', productSchema);
