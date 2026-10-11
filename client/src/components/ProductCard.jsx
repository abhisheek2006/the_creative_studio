import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { formatINR } from '../utils/format';
import { IconHeart, IconCart, IconEye } from './Icons';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="#FFF2DF"/><text x="50%" y="50%" font-family="sans-serif" font-size="26" fill="#F4A6C1" text-anchor="middle" dy=".3em">The Creative Studio</text></svg>`
  );

export default function ProductCard({ product, onQuickView }) {
  const { addItem } = useCart();
  const toast = useToast();
  const [fav, setFav] = useState(false);

  const soldOut = !product.inStock;
  const showDiscount = product.salePrice != null && product.discountPercent > 0;

  const handleAdd = () => {
    if (soldOut) {
      toast.error('This item is currently out of stock.');
      return;
    }
    addItem(product, { quantity: 1 });
    toast.success(`Added "${product.name}" to your cart.`);
  };

  return (
    <article className="product-card">
      <div className="thumb">
        <Link to={`/product/${product.slug}`} aria-label={product.name}>
          <img
            src={product.primaryImage || FALLBACK}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              e.currentTarget.src = FALLBACK;
            }}
          />
        </Link>
        {showDiscount && <span className="discount">-{product.discountPercent}%</span>}
        <div className="wish">
          <button
            type="button"
            className="fav"
            aria-label="Save for later"
            aria-pressed={fav}
            onClick={() => setFav((v) => !v)}
          >
            <IconHeart filled={fav} />
          </button>
        </div>
      </div>

      <div className="body">
        {product.category?.name && <span className="cat">{product.category.name}</span>}
        <h3>
          <Link className="link-plain" to={`/product/${product.slug}`}>
            {product.name}
          </Link>
        </h3>
        <div className="price-row">
          <span className="price">{formatINR(product.effectivePrice)}</span>
          {showDiscount && <span className="old-price">{formatINR(product.price)}</span>}
        </div>
        <span className={`stock-tag ${soldOut ? 'out' : 'in'}`}>
          {soldOut ? 'Out of stock' : product.stockQuantity <= 5 ? `Only ${product.stockQuantity} left` : 'In stock'}
        </span>

        <div className="card-actions">
          <button type="button" className="btn btn-outline" onClick={() => onQuickView?.(product)}>
            <IconEye width="16" height="16" /> Quick view
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={soldOut}
          >
            <IconCart width="16" height="16" /> Add
          </button>
        </div>
      </div>
    </article>
  );
}