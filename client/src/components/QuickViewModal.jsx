import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/format';
import { IconClose, IconCart, IconArrowLeft } from './Icons';
import { Squiggle } from './Doodles';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#FFF2DF"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="#C6A0F5" text-anchor="middle" dy=".3em">The Creative Studio</text></svg>`
  );

export default function QuickViewModal({ product, onClose }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(
    (product.images || []).findIndex((i) => i.isPrimary)
  );
  const images = product.images?.length ? product.images : [{ url: FALLBACK, alt: product.name }];
  const index = active >= 0 ? active : 0;
  const soldOut = !product.inStock;

  const handleAdd = () => {
    if (soldOut) {
      toast.error('This item is currently out of stock.');
      return;
    }
    addItem(product, { quantity: qty });
    toast.success('Added to your cart.');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="icon-btn modal-close" onClick={onClose} aria-label="Close">
          <IconClose />
        </button>

        <div className="pd-grid" style={{ gap: '1.6rem' }}>
          <div>
            <div className="gallery-main">
              <img src={images[index]?.url || FALLBACK} alt={images[index]?.alt || product.name} />
            </div>
            {images.length > 1 && (
              <div className="gallery-thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.url || i}
                    type="button"
                    className={i === index ? 'active' : ''}
                    onClick={() => setActive(i)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pd-info">
            {product.category?.name && <div className="pd-cat">{product.category.name}</div>}
            <h2 style={{ color: 'var(--forest)' }}>{product.name}</h2>
            <Squiggle className="squiggle" color="#F6C75B" />
            <div className="pd-price-row">
              <span className="pd-price">{formatINR(product.effectivePrice)}</span>
              {product.salePrice != null && (
                <>
                  <span className="pd-old">{formatINR(product.price)}</span>
                  <span className="pd-off">-{product.discountPercent}%</span>
                </>
              )}
            </div>
            <p className="pd-desc">{product.shortDescription || product.description}</p>

            <div className="option-group">
              <span>Quantity</span>
              <div className="qty-selector">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max={Math.max(product.stockQuantity || 1, 1)}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Math.min(999, parseInt(e.target.value, 10) || 1)))}
                  aria-label="Quantity"
                />
                <button type="button" onClick={() => setQty((q) => Math.min(999, q + 1))} aria-label="Increase">
                  +
                </button>
              </div>
            </div>

            <div className="pd-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={soldOut}>
                <IconCart width="16" height="16" /> {soldOut ? 'Out of stock' : 'Add to cart'}
              </button>
              <Link to={`/product/${product.slug}`} className="btn btn-outline">
                Full details <IconArrowLeft width="16" height="16" style={{ transform: 'rotate(180deg)' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}