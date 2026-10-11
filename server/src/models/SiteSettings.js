const mongoose = require('mongoose');
const env = require('../config/env');

const siteSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'site', unique: true, index: true },
    businessName: { type: String, default: 'The Creative Studio', trim: true, maxlength: 200 },
    tagline: {
      type: String,
      default: 'Create \u2022 Craft \u2022 Customize \u2022 Share Happiness.',
      trim: true,
      maxlength: 300,
    },
    logoUrl: { type: String, default: '' },
    logoPublicId: { type: String, default: '' },
    whatsappNumber: { type: String, default: env.whatsappNumber, trim: true },
    instagramUrl: { type: String, default: env.instagramUrl, trim: true },
    instagramUsername: { type: String, default: '@the_creativestudio26', trim: true },
    currency: { type: String, default: env.currency || 'INR', trim: true },
    contactEmail: { type: String, default: '', trim: true },
    contactPhone: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true, maxlength: 500 },
    deliveryInformation: {
      type: String,
      default:
        'Delivery charges are confirmed on WhatsApp based on your location and order size. Local pickup is also available.',
      trim: true,
      maxlength: 3000,
    },
    announcementBarText: {
      type: String,
      default: 'Handmade with Love, Just for You.',
      trim: true,
      maxlength: 300,
    },
    footerText: {
      type: String,
      default: 'Handmade gifts, paintings, flowers and printing services made with love.',
      trim: true,
      maxlength: 2000,
    },
    aboutText: { type: String, default: '', trim: true, maxlength: 8000 },
    featuredProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    defaultDeliveryFee: { type: Number, default: null, min: 0 },
    freeDeliveryThreshold: { type: Number, default: null, min: 0 },
    socialLinks: {
      facebook: { type: String, default: '' },
      youtube: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
  },
  { timestamps: true }
);

siteSettingsSchema.statics.getSingleton = async function getSingleton() {
  let settings = await this.findOne({ key: 'site' });
  if (!settings) settings = await this.create({ key: 'site' });
  return settings;
};

siteSettingsSchema.statics.getPublic = async function getPublic() {
  const s = await this.getSingleton();
  return {
    businessName: s.businessName,
    tagline: s.tagline,
    logoUrl: s.logoUrl,
    whatsappNumber: s.whatsappNumber,
    instagramUrl: s.instagramUrl,
    instagramUsername: s.instagramUsername,
    currency: s.currency,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    address: s.address,
    deliveryInformation: s.deliveryInformation,
    announcementBarText: s.announcementBarText,
    footerText: s.footerText,
    aboutText: s.aboutText,
    defaultDeliveryFee: s.defaultDeliveryFee,
    freeDeliveryThreshold: s.freeDeliveryThreshold,
    socialLinks: s.socialLinks,
  };
};

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);
