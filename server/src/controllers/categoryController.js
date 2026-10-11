const Category = require('../models/Category');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { publicCategory, publicProduct } = require('../utils/productMapper');
const { escapeRegex } = require('../utils/sanitize');

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();
  const data = await Promise.all(
    categories.map(async (c) => {
      const count = await Product.countDocuments({ category: c._id, status: 'active' });
      return { ...publicCategory(c), productCount: count };
    })
  );
  return sendSuccess(res, { categories: data });
});

exports.getCategoryBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('Category not found.');
  const count = await Product.countDocuments({ category: category._id, status: 'active' });
  return sendSuccess(res, {
    category: { ...publicCategory(category), productCount: count },
  });
});

exports.getCategoryProducts = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) throw ApiError.notFound('Category not found.');

  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 12, maxLimit: 48 });
  const { search, sort } = req.query;

  const filter = { status: 'active', category: category._id };
  if (search) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { shortDescription: { $regex: term, $options: 'i' } },
    ];
  }

  const sortMap = {
    newest: { createdAt: -1 },
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    'name-asc': { name: 1 },
  };
  const sortStage = sortMap[sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortStage).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    category: { ...publicCategory(category), productCount: total },
    products: products.map((p) => publicProduct({ ...p, category: { _id: category._id, name: category.name, slug: category.slug } })),
    pagination: buildPaginated(products, total, page, limit).pagination,
  });
});