import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatINR } from '../utils/format';
import { EmptyState } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import { IconTrash, IconArrowLeft } from '../components/Icons';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="#FFF2DF"/><text x="50%" y="50%" font-family="sans-serif" font-size="14" fill="#F4A6C1" text-anchor="middle" dy=".3em">TCS</text></svg>`
  );

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { settings } = useSettings();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="container">
        <div className="page-head">
          <h1>Shopping Cart</h1>
          <Squiggle color="#F4A6C1" />
        </div>
        <EmptyState
          emoji="🛍️"
          title="Your cart is empty"
          text="Add some handmade loveliness to your cart and come back here."
          action={
            <Link to="/shop" className="btn btn-primary btn-lg" style={{ marginTop: '1rem' }}>
              Start shopping
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          your basket
        </span>
        <h1>Shopping Cart</h1>
        <Squiggle color="#F4A6C1" />
      </div>

      <div className="cart-layout">
        <div>
          <div className="flex-btw" style={{ marginBottom: '0.8rem' }}>
            <p className="muted">{itemCount} item(s) in your cart</p>
            <button type="button" className="remove-link" onClick={clearCart}>
              Clear cart
            </button>
          </div>

          {items.map((item) => (
            <div className="cart-item" key={`${item.productId}-${item.variationsText}`}>
              <img src={item.image || FALLBACK} alt={item.name} />
              <div className="ci-info">
                <h3>
                  <Link className="link-plain" to={`/product/${item.slug}`}>
                    {item.name}
                  </Link>
                </h3>
                {item.variationsText && <div className="variant">{item.variationsText}</div>}
                <div className="unit">{formatINR(item.unitPrice)} each</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginTop: '0.4rem' }}>
                  <div className="qty-selector" style={{ transform: 'scale(0.9)', transformOrigin: 'left' }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.variationsText, item.quantity - 1)}
                      aria-label="Decrease"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.productId, item.variationsText, e.target.value)}
                      aria-label="Quantity"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.productId, item.variationsText, item.quantity + 1)}
                      aria-label="Increase"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="remove-link"
                    onClick={() => removeItem(item.productId, item.variationsText)}
                  >
                    <IconTrash width="14" height="14" /> Remove
                  </button>
                </div>
              </div>
              <div className="ci-right">
                <span className="line-total">{formatINR(item.unitPrice * item.quantity)}</span>
              </div>
            </div>
          ))}

          <Link to="/shop" className="btn btn-outline" style={{ marginTop: '0.6rem' }}>
            <IconArrowLeft width="16" height="16" /> Continue shopping
          </Link>
        </div>

        <aside className="summary-card">
          <h3>Order summary</h3>
          <div className="summary-row">
            <span>Subtotal ({itemCount} items)</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery charges</span>
            <span>To be confirmed</span>
          </div>
          <p className="summary-note">
            {settings?.deliveryInformation ||
              'Delivery charges are confirmed on WhatsApp based on your location and order size.'}
          </p>
          <div className="summary-row total">
            <span>Estimated total</span>
            <span>{formatINR(subtotal)}</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-lg btn-block"
            style={{ marginTop: '1rem' }}
            onClick={() => navigate('/checkout')}
          >
            Proceed to checkout
          </button>
          <p className="small muted" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
            Prices are re-checked for accuracy before your order is saved.
          </p>
        </aside>
      </div>
    </div>
  );
}