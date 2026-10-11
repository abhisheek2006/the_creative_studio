const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
    description: { type: String, default: '', trim: true, maxlength: 2000 },
    imageUrl: { type: String, default: '' },
    sortOrder: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isRecruitment: { type: Boolean, default: false },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
