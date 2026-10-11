const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');

const EDITABLE = [
  'businessName',
  'tagline',
  'logoUrl',
  'logoPublicId',
  'whatsappNumber',
  'instagramUrl',
  'instagramUsername',
  'currency',
  'contactEmail',
  'contactPhone',
  'address',
  'deliveryInformation',
  'announcementBarText',
  'footerText',
  'aboutText',
  'defaultDeliveryFee',
  'freeDeliveryThreshold',
  'socialLinks',
];

function cleanWhatsApp(value) {
  return String(value || '').replace(/[^\d]/g, '');
}

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getSingleton();
  return sendSuccess(res, { settings });
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const settings = await SiteSettings.getSingleton();

  EDITABLE.forEach((key) => {
    if (body[key] === undefined) return;
    if (key === 'whatsappNumber') {
      settings.whatsappNumber = cleanWhatsApp(body[key]);
      return;
    }
    if (key === 'defaultDeliveryFee' || key === 'freeDeliveryThreshold') {
      const n = body[key];
      if (n === null || n === '' || n === undefined) {
        settings[key] = null;
      } else {
        const num = Number(n);
        settings[key] = Number.isFinite(num) && num >= 0 ? num : settings[key];
      }
      return;
    }
    if (key === 'socialLinks') {
      const s = body[key] || {};
      settings.socialLinks = {
        facebook: String(s.facebook || '').trim().slice(0, 500),
        youtube: String(s.youtube || '').trim().slice(0, 500),
        twitter: String(s.twitter || '').trim().slice(0, 500),
      };
      return;
    }
    settings[key] =
      typeof body[key] === 'string' ? body[key].trim() : body[key];
  });

  if (body.featuredProductIds !== undefined) {
    if (!Array.isArray(body.featuredProductIds)) throw ApiError.badRequest('featuredProductIds must be an array.');
    settings.featuredProductIds = body.featuredProductIds
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(String(id)))
      .map(String)
      .slice(0, 24);
  }

  await settings.save();
  return sendSuccess(res, { settings }, 200, 'Settings saved.');
});