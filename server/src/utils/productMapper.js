function publicProduct(p) {
  const effective = p.salePrice != null ? p.salePrice : p.price;
  const discountPercent =
    p.salePrice != null && p.price > 0
      ? Math.round(((p.price - p.salePrice) / p.price) * 100)
      : 0;
  return {
    id: p._id,
    name: p.name,
    slug: p.slug,
    sku: p.sku || '',
    category: p.category,
    shortDescription: p.shortDescription,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice,
    effectivePrice: effective,
    discountPercent,
    stockQuantity: p.stockQuantity,
    inStock: p.stockQuantity > 0,
    images: p.images || [],
    primaryImage: (p.images || []).find((i) => i.isPrimary)?.url || (p.images || [])[0]?.url || '',
    variations: p.variations || [],
    colors: p.colors || [],
    sizes: p.sizes || [],
    customizable: p.customizable,
    customizationInstructions: p.customizationInstructions,
    specifications: p.specifications || [],
    deliveryInformation: p.deliveryInformation,
    isFeatured: p.isFeatured,
    isBestSeller: p.isBestSeller,
    soldCount: p.soldCount || 0,
    createdAt: p.createdAt,
  };
}

function publicCategory(c) {
  return {
    id: c._id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    sortOrder: c.sortOrder,
    isRecruitment: Boolean(c.isRecruitment),
  };
}

module.exports = { publicProduct, publicCategory };