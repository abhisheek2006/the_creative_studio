const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { uploadImage, validateImageFile } = require('../services/uploadService');
const { upload, maxBytes } = require('../middleware/upload');

const pickFirstFile = (req) => {
  if (!req.file) throw ApiError.badRequest('No image file was uploaded.');
  return req.file;
};

exports.uploadAdminImage = [
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const file = pickFirstFile(req);
    const check = validateImageFile(file, maxBytes);
    if (!check.ok) throw ApiError.badRequest(check.message);

    const folder = String(req.body.folder || 'tcs')
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .slice(0, 40);
    const result = await uploadImage(file.buffer, {
      filename: file.originalname,
      folder: folder || 'tcs',
    });

    return sendSuccess(res, {
      url: result.url,
      publicId: result.publicId,
      filename: file.originalname,
    }, 201, 'Image uploaded.');
  }),
];

// Public endpoint for custom-order reference images. Rate limited + size-checked.
exports.uploadPublicImage = [
  upload.single('image'),
  asyncHandler(async (req, res) => {
    const file = pickFirstFile(req);
    if (file.size > maxBytes) throw ApiError.badRequest('Image too large.');
    const check = validateImageFile(file, maxBytes);
    if (!check.ok) throw ApiError.badRequest(check.message);

    const result = await uploadImage(file.buffer, {
      filename: file.originalname,
      folder: 'tcs-submissions',
    });

    return sendSuccess(res, {
      url: result.url,
      publicId: result.publicId,
      filename: file.originalname,
    }, 201, 'Image uploaded.');
  }),
];