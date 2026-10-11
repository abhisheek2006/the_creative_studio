const Product = require('../models/Product');
const Category = require('../models/Category');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { sendSuccess, getPagination, buildPaginated } = require('../utils/response');
const { publicProduct } = require('../utils/productMapper');
const { escapeRegex } = require('../utils/sanitize');

const BASE = { status: 'active' };

function effectivePriceExpr() {
  return { $ifNull: ['$salePrice', '$price'] };
}

const PUBLIC_FIELDS = {
  name: 1,
  slug: 1,
  sku: 1,
  shortDescription: 1,
  description: 1,
  price: 1,
  salePrice: 1,
  stockQuantity: 1,
  images: 1,
  variations: 1,
  colors: 1,
  sizes: 1,
  customizable: 1,
  customizationInstructions: 1,
  specifications: 1,
  deliveryInformation: 1,
  isFeatured: 1,
  isBestSeller: 1,
  soldCount: 1,
  createdAt: 1,
};

exports.getProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query, { page: 1, limit: 12, maxLimit: 48 });
  const { search, category, minPrice, maxPrice, sort, featured, bestSeller } = req.query;

  const filter = { ...BASE };

  if (search) {
    const term = escapeRegex(search.trim());
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { shortDescription: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
    ];
  }

  if (category) {
    if (category === 'none') filter.category = null;
    else filter.category = category;
  }

  const sortMap = {
    'price-asc': { effective: 1 },
    'price-desc': { effective: -1 },
    newest: { createdAt: -1 },
    'name-asc': { name: 1 },
    popular: { soldCount: -1 },
  };

  const needsEffective =
    sortMap[sort] && sortMap[sort].effective;
  const hasPriceFilter = minPrice !== undefined && minPrice !== '' || maxPrice !== undefined && maxPrice !== '';

  if (featured === 'true') filter.isFeatured = true;
  if (bestSeller === 'true') filter.isBestSeller = true;

  const useAggregation = needsEffective || hasPriceFilter;
  const sortStage = {};
  if (sortMap[sort]) {
    Object.entries(sortMap[sort]).forEach(([k, v]) => { sortStage[k] = v; });
  } else {
    sortStage.createdAt = -1;
  }

  let products;
  let total;
  if (useAggregation) {
    const priceMatch = {};
    if (minPrice !== undefined && minPrice !== '') priceMatch.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== '') priceMatch.$lte = Number(maxPrice);

    const base = [{ $match: filter }, { $addFields: { effective: effectivePriceExpr() } }];
    if (Object.keys(priceMatch).length) base.push({ $match: { effective: priceMatch } });

    const [countDoc, result] = await Promise.all([
      Product.aggregate([...base, { $count: 'total' }]),
      Product.aggregate([...base, { $sort: sortStage }, { $skip: skip }, { $limit: limit }]),
    ]);
    total = countDoc.length ? countDoc[0].total : 0;
    products = result;
  } else {
    [products, total] = await Promise.all([
      Product.find(filter).sort(sortStage).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);
  }

  const catIds = [...new Set(products.map((p) => p.category).filter(Boolean))];
  const catDocs = await Category.find({ _id: { $in: catIds } }).select('name slug').lean();
  const catMap = {};
  catDocs.forEach((c) => { catMap[String(c._id)] = c; });

  const data = products.map((p) =>
    publicProduct({
      ...p,
      category: p.category && catMap[String(p.category)]
        ? catMap[String(p.category)]
        : { _id: p.category, name: 'Uncategorized', slug: '' },
    })
  );

  return sendSuccess(res, {
    products: data,
    pagination: buildPaginated(data, total, page, limit).pagination,
  });
});

exports.getProductBySlug = asyncHandler(async (req, res) => {
  const slug = String(req.params.slug || '').trim().toLowerCase();
  const product = await Product.findOne({ slug, status: 'active' }).lean();

  if (!product) throw ApiError.notFound('Product not found.');

  const category =
    product.category &&
    (await Category.findById(product.category).select('name slug').lean());

  const related = await Product.find({
    category: product.category,
    slug: { $ne: product.slug },
    status: 'active',
  })
    .sort({ createdAt: -1 })
    .limit(4)
    .lean();

  const relatedCats = await Category.find({
    _id: { $in: [...new Set(related.map((r) => r.category).filter(Boolean))] },
  })
    .select('name slug')
    .lean();
  const catMap = {};
  relatedCats.forEach((c) => { catMap[String(c._id)] = c; });

  return sendSuccess(res, {
    product: publicProduct({ ...product, category: category || { _id: product.category, name: '', slug: '' } }),
    related: related.map((r) =>
      publicProduct({ ...r, category: r.category && catMap[String(r.category)] || { _id: r.category, name: '', slug: '' } })
    ),
  });
});

exports.getHomeProducts = asyncHandler(async (req, res) => {
  const [featured, newArrivals, bestSellers, categories] = await Promise.all([
    Product.find({ status: 'active', isFeatured: true }).sort({ createdAt: -1 }).limit(8).lean(),
    Product.find({ status: 'active' }).sort({ createdAt: -1 }).limit(8).lean(),
    Product.find({ status: 'active' }).sort({ soldCount: -1 }).limit(8).lean(),
    Category.find({ isActive: true, isRecruitment: { $ne: true } }).sort({ sortOrder: 1 }).select('name slug imageUrl').lean(),
  ]);

  const catIds = new Set(
    [...featured, ...newArrivals, ...bestSellers].map((p) => String(p.category)).filter(Boolean)
  );
  const catDocs = await Category.find({ _id: { $in: [...catIds] } }).select('name slug').lean();
  const catMap = {};
  catDocs.forEach((c) => { catMap[String(c._id)] = c; });

  const mapWithCat = (list) =>
    list.map((p) =>
      publicProduct({
        ...p,
        category: p.category && catMap[String(p.category)] ? catMap[String(p.category)] : { _id: p.category, name: '', slug: '' },
      })
    );

  return sendSuccess(res, {
    featured: mapWithCat(featured),
    newArrivals: mapWithCat(newArrivals),
    bestSellers: mapWithCat(bestSellers),
    categories: categories.map((c) => ({ id: c._id, name: c.name, slug: c.slug, imageUrl: c.imageUrl })),
  });
});