import { useEffect, useState } from 'react';
import ImageUploader from '../ImageUploader';
import { IconPlus, IconTrash } from '../Icons';

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function emptyVariation() {
  return { name: '', optionsText: '' };
}

const DEFAULTS = {
  name: '',
  slug: '',
  category: '',
  shortDescription: '',
  description: '',
  price: '',
  salePrice: '',
  stockQuantity: '',
  sku: '',
  images: [],
  colorsText: '',
  sizesText: '',
  variations: [],
  customizable: false,
  customizationInstructions: '',
  specifications: [],
  deliveryInformation: '',
  isFeatured: false,
  isBestSeller: false,
  status: 'active',
};

function toFormState(product) {
  if (!product) return { ...DEFAULTS };
  return {
    ...DEFAULTS,
    name: product.name || '',
    slug: product.slug || '',
    category: product.category?._id || product.category || '',
    shortDescription: product.shortDescription || '',
    description: product.description || '',
    price: product.price ?? '',
    salePrice: product.salePrice ?? '',
    stockQuantity: product.stockQuantity ?? '',
    sku: product.sku || '',
    images: product.images || [],
    colorsText: (product.colors || []).join(', '),
    sizesText: (product.sizes || []).join(', '),
    variations: (product.variations || []).map((v) => ({
      name: v.name || '',
      optionsText: (v.options || []).join(', '),
    })),
    customizable: Boolean(product.customizable),
    customizationInstructions: product.customizationInstructions || '',
    specifications: (product.specifications || []).map((s) => ({ key: s.key || '', value: s.value || '' })),
    deliveryInformation: product.deliveryInformation || '',
    isFeatured: Boolean(product.isFeatured),
    isBestSeller: Boolean(product.isBestSeller),
    status: product.status || 'active',
  };
}

export default function ProductForm({ product, categories, onSubmit, submitting, submitLabel = 'Save product' }) {
  const [form, setForm] = useState(() => toFormState(product));
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setForm(toFormState(product));
    setSlugTouched(Boolean(product));
  }, [product]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const onNameChange = (value) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugTouched ? f.slug : slugify(value),
    }));
  };

  const validate = () => {
    const e = {};
    if (!form.name || form.name.trim().length < 3) e.name = 'Enter a product name (min 3 characters).';
    if (!form.category) e.category = 'Select a category.';
    const price = Number(form.price);
    if (!Number.isFinite(price) || price < 0) e.price = 'Enter a valid price.';
    if (form.salePrice !== '' && form.salePrice !== null) {
      const sale = Number(form.salePrice);
      if (!Number.isFinite(sale) || sale < 0) e.salePrice = 'Enter a valid sale price.';
      else if (sale > price) e.salePrice = 'Sale price cannot exceed the regular price.';
    }
    if (form.stockQuantity !== '' && (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0)) {
      e.stockQuantity = 'Stock must be a non-negative whole number.';
    }
    if (!form.images.length) e.images = 'Upload at least one image.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (event, forcedStatus) => {
    event.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: form.slug ? slugify(form.slug) : undefined,
      category: form.category,
      shortDescription: form.shortDescription.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      salePrice: form.salePrice === '' ? null : Number(form.salePrice),
      stockQuantity: form.stockQuantity === '' ? 0 : Number(form.stockQuantity),
      sku: form.sku.trim(),
      images: form.images,
      colors: form.colorsText.split(',').map((s) => s.trim()).filter(Boolean),
      sizes: form.sizesText.split(',').map((s) => s.trim()).filter(Boolean),
      variations: form.variations
        .filter((v) => v.name.trim())
        .map((v) => ({
          name: v.name.trim(),
          options: v.optionsText.split(',').map((s) => s.trim()).filter(Boolean),
        })),
      customizable: form.customizable,
      customizationInstructions: form.customizationInstructions.trim(),
      specifications: form.specifications.filter((s) => s.key.trim()),
      deliveryInformation: form.deliveryInformation.trim(),
      isFeatured: form.isFeatured,
      isBestSeller: form.isBestSeller,
      status: forcedStatus || form.status,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={(e) => handleSubmit(e)} noValidate>
      {Object.keys(errors).length > 0 && (
        <div className="error-banner">Please fix the highlighted fields below.</div>
      )}

      <div className="form-card" style={{ marginBottom: '1.4rem' }}>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Basic details</h3>

        <div className="field">
          <label htmlFor="p-name">Product name <span className="req">*</span></label>
          <input
            id="p-name"
            value={form.name}
            onChange={(e) => onNameChange(e.target.value)}
            className={errors.name ? 'invalid' : ''}
            placeholder="e.g. Handmade Flower Bouquet — Pastel Mix"
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="p-slug">URL slug</label>
            <input
              id="p-slug"
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
              placeholder="auto-generated"
            />
            <span className="hint">Shop URL: /product/{form.slug || 'auto-generated'}</span>
          </div>
          <div className="field">
            <label htmlFor="p-category">Category <span className="req">*</span></label>
            <select
              id="p-category"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={errors.category ? 'invalid' : ''}
            >
              <option value="">Select a category…</option>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                  {c.isRecruitment ? ' (recruitment)' : ''}
                </option>
              ))}
            </select>
            {errors.category && <span className="error">{errors.category}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="p-short">Short description</label>
          <input
            id="p-short"
            value={form.shortDescription}
            onChange={(e) => set('shortDescription', e.target.value)}
            maxLength={400}
            placeholder="One line shown on product cards"
          />
        </div>

        <div className="field">
          <label htmlFor="p-desc">Full description</label>
          <textarea
            id="p-desc"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            rows={6}
            placeholder="Describe the product, materials, size, and what's included."
          />
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: '1.4rem' }}>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Pricing & stock</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="p-price">Regular price (₹) <span className="req">*</span></label>
            <input
              id="p-price"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
              className={errors.price ? 'invalid' : ''}
            />
            {errors.price && <span className="error">{errors.price}</span>}
          </div>
          <div className="field">
            <label htmlFor="p-sale">Sale price (₹, optional)</label>
            <input
              id="p-sale"
              type="number"
              min="0"
              step="1"
              value={form.salePrice}
              onChange={(e) => set('salePrice', e.target.value)}
              className={errors.salePrice ? 'invalid' : ''}
            />
            {errors.salePrice && <span className="error">{errors.salePrice}</span>}
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="p-stock">Stock quantity</label>
            <input
              id="p-stock"
              type="number"
              min="0"
              step="1"
              value={form.stockQuantity}
              onChange={(e) => set('stockQuantity', e.target.value)}
              className={errors.stockQuantity ? 'invalid' : ''}
            />
            {errors.stockQuantity && <span className="error">{errors.stockQuantity}</span>}
          </div>
          <div className="field">
            <label htmlFor="p-sku">SKU (optional)</label>
            <input id="p-sku" value={form.sku} onChange={(e) => set('sku', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: '1.4rem' }}>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Images</h3>
        <ImageUploader value={form.images} onChange={(imgs) => set('images', imgs)} />
        {errors.images && <span className="error">{errors.images}</span>}
      </div>

      <div className="form-card" style={{ marginBottom: '1.4rem' }}>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Options & variations</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="p-colors">Color options (comma separated)</label>
            <input
              id="p-colors"
              value={form.colorsText}
              onChange={(e) => set('colorsText', e.target.value)}
              placeholder="Pink, Lavender, Mint"
            />
          </div>
          <div className="field">
            <label htmlFor="p-sizes">Size options (comma separated)</label>
            <input
              id="p-sizes"
              value={form.sizesText}
              onChange={(e) => set('sizesText', e.target.value)}
              placeholder="Small, Medium, Large"
            />
          </div>
        </div>

        <label style={{ fontWeight: 700, color: 'var(--forest)', fontSize: '0.9rem' }}>Variations</label>
        {form.variations.map((v, i) => (
          <div className="form-row" key={i} style={{ alignItems: 'end', marginTop: '0.5rem' }}>
            <div className="field" style={{ marginBottom: '0.4rem' }}>
              <input
                value={v.name}
                placeholder="Variation name (e.g. Size)"
                onChange={(e) => {
                  const next = [...form.variations];
                  next[i] = { ...next[i], name: e.target.value };
                  set('variations', next);
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="field" style={{ flex: 1, marginBottom: '0.4rem' }}>
                <input
                  value={v.optionsText}
                  placeholder="Options, comma separated"
                  onChange={(e) => {
                    const next = [...form.variations];
                    next[i] = { ...next[i], optionsText: e.target.value };
                    set('variations', next);
                  }}
                />
              </div>
              <button
                type="button"
                className="icon-action danger"
                style={{ marginBottom: '0.4rem' }}
                onClick={() => set('variations', form.variations.filter((_, x) => x !== i))}
                aria-label="Remove variation"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => set('variations', [...form.variations, emptyVariation()])}
        >
          <IconPlus width="16" height="16" /> Add variation
        </button>

        <div style={{ marginTop: '1.2rem' }}>
          <div className="field-check">
            <input
              id="p-custom"
              type="checkbox"
              checked={form.customizable}
              onChange={(e) => set('customizable', e.target.checked)}
            />
            <label htmlFor="p-custom" style={{ margin: 0 }}>
              This product can be customized
            </label>
          </div>
          {form.customizable && (
            <div className="field">
              <label htmlFor="p-custom-instr">Customization instructions</label>
              <textarea
                id="p-custom-instr"
                value={form.customizationInstructions}
                onChange={(e) => set('customizationInstructions', e.target.value)}
                rows={3}
                placeholder="Tell customers what to share (photo, colours, text, occasion…)"
              />
            </div>
          )}
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: '1.4rem' }}>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Specifications & delivery</h3>
        {form.specifications.map((s, i) => (
          <div className="form-row" key={i} style={{ alignItems: 'end' }}>
            <div className="field" style={{ marginBottom: '0.4rem' }}>
              <input
                value={s.key}
                placeholder="Specification (e.g. Material)"
                onChange={(e) => {
                  const next = [...form.specifications];
                  next[i] = { ...next[i], key: e.target.value };
                  set('specifications', next);
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="field" style={{ flex: 1, marginBottom: '0.4rem' }}>
                <input
                  value={s.value}
                  placeholder="Value (e.g. Cotton)"
                  onChange={(e) => {
                    const next = [...form.specifications];
                    next[i] = { ...next[i], value: e.target.value };
                    set('specifications', next);
                  }}
                />
              </div>
              <button
                type="button"
                className="icon-action danger"
                style={{ marginBottom: '0.4rem' }}
                onClick={() => set('specifications', form.specifications.filter((_, x) => x !== i))}
                aria-label="Remove specification"
              >
                <IconTrash />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => set('specifications', [...form.specifications, { key: '', value: '' }])}
        >
          <IconPlus width="16" height="16" /> Add specification
        </button>

        <div className="field" style={{ marginTop: '1rem' }}>
          <label htmlFor="p-delivery">Delivery / pickup information</label>
          <textarea
            id="p-delivery"
            value={form.deliveryInformation}
            onChange={(e) => set('deliveryInformation', e.target.value)}
            rows={3}
            placeholder="Delivery areas, timelines, pickup options…"
          />
        </div>
      </div>

      <div className="form-card" style={{ marginBottom: '1.4rem' }}>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Visibility</h3>
        <div className="field-check">
          <input id="p-featured" type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
          <label htmlFor="p-featured" style={{ margin: 0 }}>Feature on the homepage</label>
        </div>
        <div className="field-check">
          <input id="p-best" type="checkbox" checked={form.isBestSeller} onChange={(e) => set('isBestSeller', e.target.checked)} />
          <label htmlFor="p-best" style={{ margin: 0 }}>Mark as a best seller</label>
        </div>
        <div className="field" style={{ maxWidth: 260 }}>
          <label htmlFor="p-status">Status</label>
          <select id="p-status" value={form.status} onChange={(e) => set('status', e.target.value)}>
            <option value="active">Active (visible in shop)</option>
            <option value="inactive">Inactive (hidden)</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="flex-btw">
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting && <span className="spinner" />} {submitLabel}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, 'draft')}
          >
            Save as draft
          </button>
        </div>
      </div>
    </form>
  );
}