const ContactMessage = require('../models/ContactMessage');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');

exports.createContact = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const subject = String(body.subject || '').trim();
  const message = String(body.message || '').trim();

  if (name.length < 2) throw ApiError.badRequest('Please enter your name.');
  if (subject.length < 2) throw ApiError.badRequest('Please enter a subject.');
  if (message.length < 5) throw ApiError.badRequest('Please enter a message.');

  const saved = await ContactMessage.create({
    name,
    email,
    phone,
    subject,
    message,
    status: 'new',
  });

  return sendSuccess(
    res,
    { id: saved._id, createdAt: saved.createdAt },
    201,
    'Thank you! Your message has been received.'
  );
});