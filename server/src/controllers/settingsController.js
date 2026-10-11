const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

exports.getPublicSettings = asyncHandler(async (req, res) => {
  const settings = await SiteSettings.getPublic();
  return sendSuccess(res, { settings });
});