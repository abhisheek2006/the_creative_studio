const CustomOrder = require('../models/CustomOrder');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { generateCustomOrderReference } = require('../utils/reference');
const { normalizeWhatsApp } = require('../utils/sanitize');

exports.createCustomOrder = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const customerName = String(body.customerName || '').trim();
  const whatsappNumber = normalizeWhatsApp(body.whatsappNumber);
  const email = String(body.email || '').trim();
  const productType = String(body.productType || '').trim();
  const occasion = String(body.occasion || '').trim();
  const preferredColor = String(body.preferredColor || '').trim();
  const customizationDetails = String(body.customizationDetails || '').trim();
  const referenceImageUrl = String(body.referenceImageUrl || '').trim();

  if (customerName.length < 2) throw ApiError.badRequest('Please enter your name.');
  if (whatsappNumber.length < 8) throw ApiError.badRequest('Please enter a valid WhatsApp number.');
  if (productType.length < 2) throw ApiError.badRequest('Please select a product type.');
  if (customizationDetails.length < 10) {
    throw ApiError.badRequest('Please describe your customization idea in a little more detail.');
  }

  const budgetRaw = parseFloat(body.budget);
  const budget =
    body.budget === undefined || body.budget === null || body.budget === ''
      ? null
      : Number.isFinite(budgetRaw) && budgetRaw > 0
      ? budgetRaw
      : null;

  const quantityRaw = parseInt(body.quantity, 10);
  const quantity = Number.isInteger(quantityRaw) && quantityRaw >= 1 ? quantityRaw : 1;

  const requiredDateRaw = body.requiredDate ? new Date(body.requiredDate) : null;
  const requiredDate =
    requiredDateRaw && !Number.isNaN(requiredDateRaw.getTime()) ? requiredDateRaw : null;

  let referenceNumber = generateCustomOrderReference();
  // Extremely unlikely collision guard.
  const existingReference = await CustomOrder.findOne({ referenceNumber }).select('_id').lean();
  if (existingReference) referenceNumber = generateCustomOrderReference();

  const request = await CustomOrder.create({
    referenceNumber,
    customerName,
    whatsappNumber,
    email,
    productType,
    occasion,
    preferredColor,
    budget,
    quantity,
    requiredDate,
    customizationDetails,
    referenceImageUrl,
    status: 'pending_confirmation',
  });

  const settings = await SiteSettings.getSingleton();

  return sendSuccess(
    res,
    {
      referenceNumber: request.referenceNumber,
      customerName: request.customerName,
      whatsappNumber: request.whatsappNumber,
      productType: request.productType,
      occasion: request.occasion,
      preferredColor: request.preferredColor,
      budget: request.budget,
      quantity: request.quantity,
      requiredDate: request.requiredDate,
      customizationDetails: request.customizationDetails,
      whatsappNumber: settings.whatsappNumber,
      status: request.status,
    },
    201,
    'Your custom order request has been saved. Please review and send the WhatsApp message.'
  );
});