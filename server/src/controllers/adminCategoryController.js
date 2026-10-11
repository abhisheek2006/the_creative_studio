const mongoose = require('mongoose');
const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess } = require('../utils/response');
const { deleteImage } = require('../services/uploadService');
const { escapeRegex } = require('../utils/sanitize');

exports.listCategories = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};
  if (search) filter.name = { $regex: escapeRegex(String(search).trim()), $options: 'i' };

  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();

  const counts = await Product.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => { countMap[String(c._id)] = c.count; });

  return sendSuccess(res, {
    categories: categories.map((c) => ({
      ...c,
      productCount: countMap[String(c._id)] || (c.isRecruitment ? 0 : 0),
    })),
  });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const name = String(body.name || '').trim();
  if (name.length < 2) throw ApiError.badRequest('Category name is required.');

  const data = {
    name: name.slice(0, 160),
    description: String(body.description || '').trim().slice(0, 2000),
    sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
  if (body.slug && String(body.slug).trim()) data.slug = String(body.slug).trim().toLowerCase();
  if (body.imageUrl && typeof body.imageUrl === 'string' && body.imageUrl.trim()) {
    data.imageUrl = body.imageUrl.trim();
  }
  if (body.isRecruitment !== undefined) data.isRecruitment = Boolean(body.isRecruitment);

  const category = await Category.create(data);
  return sendSuccess(res, { category }, 201, 'Category created.');
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  const body = req.body || {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) throw ApiError.badRequest('Category name is required.');
    category.name = name.slice(0, 160);
  }
  if (body.description !== undefined) category.description = String(body.description || '').trim().slice(0, 2000);
  if (body.slug !== undefined && String(body.slug).trim()) {
    const slug = String(body.slug).trim().toLowerCase();
    if (slug !== category.slug) {
      const clash = await Category.findOne({ slug, _id: { $ne: category._id } }).select('_id').lean();
      if (clash) throw ApiError.conflict('A category with that slug already exists.');
      category.slug = slug;
    }
  }
  if (body.imageUrl !== undefined) category.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : '';
  if (body.sortOrder !== undefined) category.sortOrder = Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : 0;
  if (body.isActive !== undefined) category.isActive = Boolean(body.isActive);
  if (body.isRecruitment !== undefined) category.isRecruitment = Boolean(body.isRecruitment);

  await category.save();
  return sendSuccess(res, { category }, 200, 'Category updated.');
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw ApiError.notFound('Category not found.');

  const productCount = await Product.countDocuments({ category: category._id });
  if (productCount > 0) {
    throw ApiError.conflict(
      `This category still has ${productCount} products. Move or archive those products first.`
    );
  }

  if (category.imageUrl) {
    const publicId = String(category.imageUrl).match(/upload\/v\d+\/(.+)$/)?.[1];
    if (publicId) {
      try {
        await deleteImage(publicId);
      } catch (_err) {
        // best-effort
      }
    }
  }

  await Category.deleteOne({ _id: category._id });
  return sendSuccess(res, null, 200, 'Category deleted.');
});

exports.categoryExists = asyncHandler(async (req, res) => {
  const check = mongoose.Types.ObjectId.isValid(req.params.id)
    ? await Category.findById(req.params.id).select('_id').lean()
    : null;
  return sendSuccess(res, { exists: Boolean(check) });
});