import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { extractError } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { formatINR } from '../utils/format';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import Seo, { siteUrl } from '../components/Seo';
import { PageLoader, EmptyState } from '../components/Loader';
import { Squiggle, HeartDoodle } from '../components/Doodles';
import { IconCart, IconWhatsApp, IconCheck, IconTruck } from '../components/Icons';
import { whatsappLink, buildBuyNowMessage } from '../utils/whatsapp';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="#FFF2DF"/><text x="50%" y="50%" font-family="sans-serif" font-size="26" fill="#C6A0F5" text-anchor="middle" dy=".3em">The Creative Studio</text></svg>`
  );

export default function ProductDetails() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const toast = useToast();
  const { settings } = useSettings();

  const [state, setState] = useState({ loading: true, product: null, related: [], notFound: false });
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [variationSel, setVariationSel] = useState({});
  const [quickView, setQuickView] = useState(null);
  const [buyOpen, setBuyOpen] = useState(false);
  const [buyForm, setBuyForm] = useState({
    customerName: '',
    customerWhatsApp: '',
    deliveryMethod: 'delivery',
    deliveryAddress: '',
  });
  const [buySubmitting, setBuySubmitting] = useState(false);
  const [checkoutRequestId] = useState(() => (crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}`));

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, notFound: false }));
    api
      .get(`/products/${slug}`)
      .then((res) => {
        if (!active) return;
        setState({ loading: false, product: res.data.data.product, related: res.data.data.related, notFound: false });
        setActiveImg(0);
        setQty(1);
        setSelectedColor('');
        setSelectedSize('');
        setVariationSel({});
      })
      .catch((err) => {
        if (!active) return;
        setState({ loading: false, product: null, related: [], notFound: err.response?.status === 404 });
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (state.loading) return <PageLoader full />;
  if (state.notFound || !state.product) {
    return (
      <div className="container">
        <EmptyState
          emoji="🌼"
          title="Product not found"
          text="This product may have been removed or is no longer available."
          action={
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Back to shop
            </Link>
          }
        />
      </div>
    );
  }

  const p = state.product;
  const images = p.images?.length ? p.images : [{ url: FALLBACK, alt: p.name }];
  const soldOut = !p.inStock;
  const variationsText = [
    selectedColor ? `Color: ${selectedColor}` : '',
    selectedSize ? `Size: ${selectedSize}` : '',
    ...Object.entries(variationSel).map(([k, v]) => `${k}: ${v}`),
  ]
    .filter(Boolean)
    .join(', ');

  const currentVariations = {
    ...(selectedColor ? { Color: selectedColor } : {}),
    ...(selectedSize ? { Size: selectedSize } : {}),
    ...variationSel,
  };

  const handleAddToCart = () => {
    if (soldOut) return toast.error('This item is out of stock.');
    addItem(p, { quantity: qty, variations: currentVariations });
    toast.success('Added to your cart.');
  };

  const validateBuy = () => {
    if (!buyForm.customerName.trim()) return 'Please enter your name.';
    if (String(buyForm.customerWhatsApp).replace(/\D/g, '').length < 8) return 'Please enter a valid WhatsApp number.';
    if (buyForm.deliveryMethod === 'delivery' && buyForm.deliveryAddress.trim().length < 5)
      return 'Please enter your delivery address.';
    return null;
  };

  const handleBuyNow = async () => {
    const error = validateBuy();
    if (error) return toast.error(error);
    setBuySubmitting(true);
    try {
      const res = await api.post('/orders', {
        checkoutRequestId,
        customerName: buyForm.customerName.trim(),
        customerWhatsApp: buyForm.customerWhatsApp.trim(),
        deliveryMethod: buyForm.deliveryMethod,
        deliveryAddress: buyForm.deliveryAddress.trim(),
        items: [{ productId: p.id, quantity: qty, variations: currentVariations }],
      });
      const data = res.data.data;
      const message = buildBuyNowMessage({
        name: p.name,
        quantity: qty,
        unitPrice: data.items[0].unitPrice,
        subtotal: data.items[0].lineSubtotal,
        orderReference: data.orderReference,
        customerName: buyForm.customerName.trim(),
        deliveryAddress: buyForm.deliveryAddress.trim(),
        deliveryMethod: buyForm.deliveryMethod,
        variationsText,
      });
      window.open(whatsappLink(settings?.whatsappNumber || '919679573542', message), '_blank');
      toast.success('Inquiry saved. WhatsApp opened — please review and press Send to reach us.');
      setBuyOpen(false);
    } catch (err) {
      toast.error(extractError(err, 'Could not place your order.'));
    } finally {
      setBuySubmitting(false);
    }
  };

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.shortDescription || p.description || undefined,
    image: images.map((i) => i.url).filter(Boolean),
    sku: p.sku || undefined,
    category: p.category?.name || undefined,
    brand: { '@type': 'Brand', name: 'The Creative Studio' },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl()}/product/${p.slug}`,
      priceCurrency: 'INR',
      price: p.effectivePrice,
      availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  return (
    <>
      <Seo
        title={p.name}
        description={p.shortDescription || p.description}
        image={images[0]?.url}
        type="product"
        path={`/product/${p.slug}`}
        jsonLd={productJsonLd}
      />
      <div className="container" style={{ paddingTop: '1.6rem' }}>
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link>
          {p.category?.name && p.category?.slug && (
            <>
              {' '}/ <Link to={`/category/${p.category.slug}`}>{p.category.name}</Link>
            </>
          )}{' '}
          / {p.name}
        </div>

        <div className="pd-grid">
          <div>
            <div className="gallery-main">
              <img src={images[activeImg]?.url || FALLBACK} alt={images[activeImg]?.alt || p.name} />
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.url || i}
                    type="button"
                    className={i === activeImg ? 'active' : ''}
                    onClick={() => setActiveImg(i)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pd-info">
            {p.category?.name && <div className="pd-cat">{p.category.name}</div>}
            <h1>{p.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              <HeartDoodle size={18} color="#F4A6C1" />
              <span className="muted small">{p.soldCount > 0 ? `${p.soldCount}+ sold` : 'Handmade to order'}</span>
            </div>

            <div className="pd-price-row">
              <span className="pd-price">{formatINR(p.effectivePrice)}</span>
              {p.salePrice != null && (
                <>
                  <span className="pd-old">{formatINR(p.price)}</span>
                  <span className="pd-off">-{p.discountPercent}%</span>
                </>
              )}
            </div>

            <p className="pd-desc">{p.description || p.shortDescription}</p>

            <div style={{ marginTop: '0.8rem' }}>
              <span className={`stock-tag ${soldOut ? 'out' : 'in'}`} style={{ fontSize: '0.9rem' }}>
                {soldOut
                  ? '✕ Out of stock'
                  : p.stockQuantity <= 5
                  ? `Only ${p.stockQuantity} left in stock`
                  : '✓ In stock'}
              </span>
            </div>

            {p.colors?.length > 0 && (
              <div className="option-group">
                <span>Colour</span>
                <div className="option-chips">
                  {p.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`option-chip ${selectedColor === c ? 'active' : ''}`}
                      onClick={() => setSelectedColor(selectedColor === c ? '' : c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {p.sizes?.length > 0 && (
              <div className="option-group">
                <span>Size</span>
                <div className="option-chips">
                  {p.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`option-chip ${selectedSize === s ? 'active' : ''}`}
                      onClick={() => setSelectedSize(selectedSize === s ? '' : s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {p.variations?.map((v) => (
              <div className="option-group" key={v.name}>
                <span>{v.name}</span>
                <div className="option-chips">
                  {v.options.map((o) => (
                    <button
                      key={o}
                      type="button"
                      className={`option-chip ${variationSel[v.name] === o ? 'active' : ''}`}
                      onClick={() =>
                        setVariationSel((prev) => ({ ...prev, [v.name]: prev[v.name] === o ? '' : o }))
                      }
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {p.customizable && (
              <div className="info-box" style={{ background: 'var(--lavender-soft)', borderStyle: 'solid', borderColor: 'var(--lavender)' }}>
                <h4>✦ This product can be customised</h4>
                <p className="small" style={{ margin: '0.3rem 0 0' }}>
                  {p.customizationInstructions || 'Share your colours, text or reference on WhatsApp after ordering.'}
                </p>
              </div>
            )}

            <div className="option-group" style={{ marginTop: '1.2rem' }}>
              <span>Quantity</span>
              <div className="qty-selector">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(p.stockQuantity || 1, 1)}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))}
                  aria-label="Quantity"
                />
                <button type="button" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Increase quantity">
                  +
                </button>
              </div>
            </div>

            <div className="pd-actions">
              <button type="button" className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={soldOut}>
                <IconCart width="18" height="18" /> Add to Cart
              </button>
              <button type="button" className="btn btn-whatsapp btn-lg" onClick={() => setBuyOpen(true)} disabled={soldOut}>
                <IconWhatsApp width="18" height="18" /> Buy Now
              </button>
            </div>

            <div className="info-box">
              <h4>Delivery &amp; pickup</h4>
              <ul>
                <li>
                  <IconTruck width="16" height="16" />
                  <span>{p.deliveryInformation || settings?.deliveryInformation || 'Delivery charges confirmed on WhatsApp.'}</span>
                </li>
                <li>
                  <IconCheck width="16" height="16" />
                  <span>Every inquiry is saved; WhatsApp is only a message away.</span>
                </li>
              </ul>
            </div>

            {p.specifications?.length > 0 && (
              <div className="info-box">
                <h4>Specifications</h4>
                <table className="spec-table">
                  <tbody>
                    {p.specifications.map((s) => (
                      <tr key={s.key}>
                        <td>{s.key}</td>
                        <td>{s.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {state.related.length > 0 && (
          <section>
            <div className="section-head">
              <span className="kicker">you may also love</span>
              <h2>Related products</h2>
              <Squiggle color="#A9DCC7" />
            </div>
            <div className="prod-grid">
              {state.related.map((r) => (
                <ProductCard key={r.id} product={r} onQuickView={setQuickView} />
              ))}
            </div>
          </section>
        )}
      </div>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}

      {/* BUY NOW MODAL */}
      {buyOpen && (
        <div className="modal-backdrop" onClick={() => !buySubmitting && setBuyOpen(false)} role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="icon-btn modal-close"
              onClick={() => setBuyOpen(false)}
              aria-label="Close"
              disabled={buySubmitting}
            >
              ✕
            </button>
            <h3 style={{ color: 'var(--forest)' }}>Buy Now — quick order</h3>
            <p className="muted small">
              We'll save your inquiry and open WhatsApp with a complete order summary for you to send.
            </p>

            <div className="field">
              <label htmlFor="bn-name">Your name <span className="req">*</span></label>
              <input
                id="bn-name"
                value={buyForm.customerName}
                onChange={(e) => setBuyForm((f) => ({ ...f, customerName: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="bn-wa">WhatsApp number <span className="req">*</span></label>
              <input
                id="bn-wa"
                inputMode="tel"
                placeholder="+91 9679573542"
                value={buyForm.customerWhatsApp}
                onChange={(e) => setBuyForm((f) => ({ ...f, customerWhatsApp: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>Fulfilment</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label className="field-check" style={{ margin: 0 }}>
                  <input
                    type="radio"
                    name="bn-method"
                    checked={buyForm.deliveryMethod === 'delivery'}
                    onChange={() => setBuyForm((f) => ({ ...f, deliveryMethod: 'delivery' }))}
                  />
                  Delivery
                </label>
                <label className="field-check" style={{ margin: 0 }}>
                  <input
                    type="radio"
                    name="bn-method"
                    checked={buyForm.deliveryMethod === 'pickup'}
                    onChange={() => setBuyForm((f) => ({ ...f, deliveryMethod: 'pickup' }))}
                  />
                  Pickup
                </label>
              </div>
            </div>
            {buyForm.deliveryMethod === 'delivery' && (
              <div className="field">
                <label htmlFor="bn-addr">Delivery address <span className="req">*</span></label>
                <textarea
                  id="bn-addr"
                  rows={3}
                  value={buyForm.deliveryAddress}
                  onChange={(e) => setBuyForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
                />
              </div>
            )}

            <div className="summary-card" style={{ position: 'static', boxShadow: 'none', marginBottom: '1rem' }}>
              <div className="summary-row">
                <span>{p.name} × {qty}</span>
                <span>{formatINR(p.effectivePrice * qty)}</span>
              </div>
              <div className="summary-row total">
                <span>Subtotal</span>
                <span>{formatINR(p.effectivePrice * qty)}</span>
              </div>
              <p className="summary-note" style={{ marginBottom: 0 }}>
                Delivery charges will be confirmed on WhatsApp.
              </p>
            </div>

            <button type="button" className="btn btn-whatsapp btn-lg btn-block" onClick={handleBuyNow} disabled={buySubmitting}>
              {buySubmitting ? <span className="spinner" /> : <IconWhatsApp width="18" height="18" />}
              {buySubmitting ? 'Saving…' : 'Place order via WhatsApp'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}