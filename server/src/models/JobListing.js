const mongoose = require('mongoose');
const slugify = require('slugify');

const jobListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, unique: true, index: true, lowercase: true, trim: true },
    employer: { type: String, required: true, trim: true, maxlength: 220 },
    description: { type: String, required: true, trim: true, maxlength: 12000 },
    eligibility: { type: String, default: '', trim: true, maxlength: 4000 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    employmentType: {
      type: String,
      enum: ['full_time', 'part_time', 'contract', 'internship', 'temporary', 'other'],
      default: 'full_time',
    },
    salaryInformation: { type: String, default: '', trim: true, maxlength: 300 },
    applicationDeadline: { type: Date, default: null },
    applicationUrl: { type: String, default: '', trim: true },
    contactInformation: { type: String, default: '', trim: true, maxlength: 400 },
    isVerified: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft',
      index: true,
    },
  },
  { timestamps: true }
);

jobListingSchema.pre('validate', function ensureSlug(next) {
  if (!this.slug && this.title) {
    const base = slugify(`${this.title}-${this.employer || ''}`, { lower: true, strict: true });
    this.slug = base || slugify(this.title, { lower: true, strict: true });
  }
  next();
});

module.exports = mongoose.model('JobListing', jobListingSchema);
