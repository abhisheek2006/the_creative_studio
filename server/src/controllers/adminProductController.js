const mongoose = require('mongoose');
const Product = require('../models/Product');
const SiteSettings = require('../models/SiteSettings');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { deleteImage } = require('../services/uploadService');
const { escapeRegex } = require('../utils/sanitize');

function toNum(value, fallback = null) {
  if (value === undefined || value === null || value === '') return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return value === true || value === 'true' || value === '1' || value === 'on';
}

function normalizeImages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((img) => img && typeof img.url === 'string' && img.url.trim())
    .map((img) => ({
      url: img.url.trim(),
      publicId: typeof img.publicId === 'string' ? img.publicId : '',
      alt: typeof img.alt === 'string' ? img.alt : '',
      isPrimary: Boolean(img.isPrimary),
    }));
}

function normalizeVariations(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => v && String(v.name || '').trim())
    .map((v) => ({
      name: String(v.name).trim().slice(0, 80),
      options: (Array.isArray(v.options) ? v.options : [])
        .map((o) => String(o).trim())
        .filter(Boolean)
        .slice(0, 40),
    }))
    .slice(0, 20);
}

function normalizeSpecs(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && String(s.key || '').trim())
    .map((s) => ({
      key: String(s.key).trim().slice(0, 120),
      value: String(s.value || '').trim().slice(0, 500),
    }))
    .slice(0, 40);
}

function parseStrings(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => String(s).trim()).filter(Boolean).slice(0, 40);
}

async function buildProductData(body, existing = null) {
  const data = {};

  if (existing === null) {
    const name = String(body.name || '').trim();
    if (name.length < 3) throw ApiError.badRequest('Product name must be at least 3 characters.');
    data.name = name.slice(0, 220);
    if (body.slug && String(body.slug).trim()) data.slug = String(body.slug).trim().toLowerCase();
    else data.slug = await Product.buildUniqueSlug(name);
  } else {
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length < 3) throw ApiError.badRequest('Product name must be at least 3 characters.');
      data.name = name.slice(0, 220);
    }
    if (body.slug !== undefined && String(body.slug).trim()) {
      const newSlug = String(body.slug).trim().toLowerCase();
      if (newSlug !== existing.slug) {
        const clash = await Product.findOne({ slug: newSlug, _id: { $ne: existing._id } }).select('_id').lean();
        if (clash) throw ApiError.conflict('A product with that slug already exists.');
        data.slug = newSlug;
      }
    } else if (body.name !== undefined) {
      data.slug = await Product.buildUniqueSlug(data.name, existing._id);
    }
  }

  const category = body.category !== undefined ? String(body.category || '').trim() : null;
  if (body.category !== undefined && !mongoose.Types.ObjectId.isValid(category)) {
    throw ApiError.badRequest('Please select a valid category.');
  }
  if (category) data.category = category;

  const textFields = {
    sku: 80,
    shortDescription: 400,
    description: 20000,
    customizationInstructions: 4000,
    deliveryInformation: 2000,
  };
  Object.entries(textFields).forEach(([key, max]) => {
    if (body[key] !== undefined && body[key] !== null) {
      data[key] = String(body[key]).trim().slice(0, max);
    }
  });

  if (body.price !== undefined) {
    const price = toNum(body.price, null);
    if (price === null || price < 0) throw ApiError.badRequest('Price must be a non-negative number.');
    data.price = price;
  }

  if (body.salePrice !== undefined) {
    let salePrice = toNum(body.salePrice, null);
    if (salePrice !== null) {
      if (salePrice < 0) throw ApiError.badRequest('Sale price cannot be negative.');
      const refPrice = data.price !== undefined ? data.price : existing ? existing.price : 0;
      if (salePrice > refPrice) throw ApiError.badRequest('Sale price must not exceed the regular price.');
    }
    data.salePrice = salePrice;
  }

  if (body.stockQuantity !== undefined) {
    const stock = toNum(body.stockQuantity, 0);
    if (stock === null || stock < 0 || !Number.isInteger(stock)) {
      throw ApiError.badRequest('Stock quantity must be a non-negative whole number.');
    }
    data.stockQuantity = stock;
  }

  if (body.images !== undefined) data.images = normalizeImages(body.images);
  if (body.variations !== undefined) data.variations = normalizeVariations(body.variations);
  if (body.colors !== undefined) data.colors = parseStrings(body.colors);
  if (body.sizes !== undefined) data.sizes = parseStrings(body.sizes);
  if (body.specifications !== undefined) data.specifications = normalizeSpecs(body.specifications);

  if (body.customizable !== undefined) data.customizable = toBool(body.customizable);
  if (body.isFeatured !== undefined) data.isFeatured = toBool(body.isFeatured);
  if (body.isBestSeller !== undefined) data.isBestSeller = toBool(body.isBestSeller);

  if (body.status !== undefined) {
    const status = String(body.status).trim();
    if (!['active', 'inactive', 'draft', 'archived'].includes(status)) {
      throw ApiError.badRequest('Invalid product status.');
    }
    data.status = status;
  }

  return data;
}

exports.listProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 12, maxLimit: 100 });
  const { search, category, status, sort } = req.query;

  const filter = {};
  if (search) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { sku: { $regex: term, $options: 'i' } },
      { slug: { $regex: term, $options: 'i' } },
    ];
  }
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (status === 'low-stock') {
    delete filter.status;
    filter.stockQuantity = { $lte: 5 };
  }

  const sortMap = {
    newest: { createdAt: -1 },
    'name-asc': { name: 1 },
    price: { price: 1 },
    stock: { stockQuantity: 1 },
  };
  const sortStage = sortMap[sort] || { createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortStage)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  return sendSuccess(res, {
    products,
    pagination: buildPaginated(products, total, page, limit).pagination,
  });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate('category');
  if (!product) throw ApiError.notFound('Product not found.');
  return sendSuccess(res, { product });
});

exports.createProduct = asyncHandler(async (req, res) => {
  const data = await buildProductData(req.body || {});
  if (!data.category) throw ApiError.badRequest('Please select a category.');

  if (!data.images || data.images.length === 0) {
    throw ApiError.badRequest('Please upload at least one product image.');
  }
  if (!data.images.some((i) => i.isPrimary)) data.images[0].isPrimary = true;

  const product = await Product.create(data);
  return sendSuccess(res, { product }, 201, 'Product created successfully.');
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id);
  if (!existing) throw ApiError.notFound('Product not found.');

  const data = await buildProductData(req.body || {}, existing);

  if (req.body.images !== undefined && data.images.length === 0) {
    throw ApiError.badRequest('A product must keep at least one image. Upload a new one before removing it.');
  }

  // Remove remote images that are no longer used.
  const oldIds = new Set((existing.images || []).map((i) => i.publicId).filter(Boolean));
  const newIds = new Set((data.images || []).map((i) => i.publicId).filter(Boolean));
  for (const id of oldIds) {
    if (!newIds.has(id)) {
      try {
        await deleteImage(id);
      } catch (_err) {
        // Remote deletion is best-effort.
      }
    }
  }

  if (data.images && data.images.length && !data.images.some((i) => i.isPrimary)) {
    data.images[0].isPrimary = true;
  }

  Object.assign(existing, data);
  await existing.save();
  return sendSuccess(res, { product: existing }, 200, 'Product updated successfully.');
});

exports.updateProductStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['active', 'inactive', 'draft', 'archived'].includes(String(status))) {
    throw ApiError.badRequest('Invalid status.');
  }
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  if (String(status) === 'archived' && String(product.status) !== 'archived') {
    const settings = await SiteSettings.getSingleton();
    settings.featuredProductIds = settings.featuredProductIds.filter(
      (id) => String(id) !== String(product._id)
    );
    await settings.save();
  }

  product.status = status;
  await product.save();
  return sendSuccess(res, { product }, 200, `Product ${String(status) === 'archived' ? 'archived' : 'status updated'}.`);
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found.');

  // A "hard" delete. Prefer archiving (status = 'archived') to preserve order history.
  for (const img of product.images || []) {
    if (img.publicId) {
      try {
        await deleteImage(img.publicId);
      } catch (_err) {
        // best-effort
      }
    }
  }
  await Product.deleteOne({ _id: product._id });

  const settings = await SiteSettings.getSingleton();
  settings.featuredProductIds = settings.featuredProductIds.filter(
    (id) => String(id) !== String(product._id)
  );
  await settings.save();

  return sendSuccess(res, null, 200, 'Product deleted.');
});