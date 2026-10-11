import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { extractError } from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { formatINR } from '../utils/format';
import { EmptyState } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import { IconWhatsApp, IconArrowLeft, IconCheck } from '../components/Icons';
import { whatsappLink, buildCartCheckoutMessage } from '../utils/whatsapp';

function newRequestId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readRequestId() {
  try {
    const existing = sessionStorage.getItem('tcs_checkout_request_id');
    if (existing) return existing;
  } catch (_e) {
    // ignore
  }
  const id = newRequestId();
  try {
    sessionStorage.setItem('tcs_checkout_request_id', id);
  } catch (_e) {
    // ignore
  }
  return id;
}

export default function Checkout() {
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { settings } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: '',
    customerWhatsApp: '',
    customerEmail: '',
    deliveryMethod: 'delivery',
    deliveryAddress: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [requestId, setRequestId] = useState(readRequestId);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const previewMessage = useMemo(
    () =>
      buildCartCheckoutMessage({
        items,
        subtotal,
        deliveryFee: null,
        deliveryFeePending: true,
        total: subtotal,
        orderReference: 'TCS-XXXXXXXX-XXXXXX',
        customerName: form.customerName || '[Your name]',
        customerWhatsApp: form.customerWhatsApp || '[Your number]',
        deliveryAddress: form.deliveryAddress || '[Your address]',
        deliveryMethod: form.deliveryMethod,
      }),
    [items, subtotal, form]
  );

  if (items.length === 0 && !result) {
    return (
      <div className="container">
        <div className="page-head">
          <h1>Checkout</h1>
        </div>
        <EmptyState
          emoji="🧺"
          title="Nothing to check out"
          text="Your cart is empty."
          action={
            <Link to="/shop" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Go shopping
            </Link>
          }
        />
      </div>
    );
  }

  const validate = () => {
    if (form.customerName.trim().length < 2) return 'Please enter your name.';
    if (String(form.customerWhatsApp).replace(/\D/g, '').length < 8) return 'Please enter a valid WhatsApp number.';
    if (form.deliveryMethod === 'delivery' && form.deliveryAddress.trim().length < 5)
      return 'Please enter your delivery address.';
    return null;
  };

  const handleSubmit = async () => {
    const error = validate();
    if (error) return toast.error(error);

    setSubmitting(true);
    try {
      const res = await api.post('/orders', {
        checkoutRequestId: requestId,
        customerName: form.customerName.trim(),
        customerWhatsApp: form.customerWhatsApp.trim(),
        customerEmail: form.customerEmail.trim(),
        deliveryMethod: form.deliveryMethod,
        deliveryAddress: form.deliveryAddress.trim(),
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, variations: i.variations })),
      });
      const data = res.data.data;

      const message = buildCartCheckoutMessage({
        items: data.items.map((it) => ({ ...it })),
        subtotal: data.subtotal,
        deliveryFee: data.deliveryFee,
        deliveryFeePending: data.deliveryFeePending,
        total: data.total,
        orderReference: data.orderReference,
        customerName: form.customerName.trim(),
        customerWhatsApp: form.customerWhatsApp.trim(),
        deliveryAddress: form.deliveryAddress.trim(),
        deliveryMethod: form.deliveryMethod,
      });

      window.open(whatsappLink(settings?.whatsappNumber || '919679573542', message), '_blank');
      setResult({ ...data, message });
      clearCart();
      try {
        sessionStorage.removeItem('tcs_checkout_request_id');
      } catch (_e) {
        // ignore
      }
      toast.success('Inquiry saved. WhatsApp opened — press Send to confirm with us.');
    } catch (err) {
      toast.error(extractError(err, 'We could not save your order. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="container">
        <div className="page-head">
          <span className="kicker hand" style={{ color: 'var(--forest)' }}>
            almost there
          </span>
          <h1>Order inquiry saved</h1>
          <Squiggle color="#A9DCC7" />
        </div>

        <div className="form-card" style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="success-banner">
            <strong>Your inquiry is saved with reference {result.orderReference}.</strong>
            <p style={{ margin: '0.4rem 0 0' }}>
              WhatsApp has been opened with your order details. {result.alreadySubmitted
                ? 'This request was already received — you can reuse the message below.'
                : 'Please review it and press Send in WhatsApp to confirm with us. Your order is not confirmed until we reply.'}
            </p>
          </div>

          <div className="summary-card" style={{ position: 'static', marginBottom: '1rem' }}>
            <div className="summary-row">
              <span>Items</span>
              <span>{result.items.length}</span>
            </div>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(result.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{result.deliveryFeePending ? 'To be confirmed' : formatINR(result.deliveryFee)}</span>
            </div>
            <div className="summary-row total">
              <span>{result.deliveryFeePending ? 'Estimated total' : 'Total'}</span>
              <span>{formatINR(result.total ?? result.subtotal)}</span>
            </div>
          </div>

          <div className="whatsapp-preview chat-bubble">{result.message}</div>

          <div className="pd-actions" style={{ marginTop: '1rem' }}>
            <a
              className="btn btn-whatsapp btn-lg"
              href={whatsappLink(settings?.whatsappNumber || '919679573542', result.message)}
              target="_blank"
              rel="noreferrer noopener"
            >
              <IconWhatsApp width="18" height="18" /> Open WhatsApp again
            </a>
            <Link to="/shop" className="btn btn-outline btn-lg">
              <IconArrowLeft width="16" height="16" /> Continue shopping
            </Link>
          </div>

          <p className="small muted" style={{ marginTop: '1rem' }}>
            Keep your reference <strong>{result.orderReference}</strong>. You can check its status on the{' '}
            <Link to="/track">track order</Link> page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          nearly yours
        </span>
        <h1>Checkout</h1>
        <Squiggle color="#F4A6C1" />
        <p>Fill in your details, then send the prepared WhatsApp message to confirm.</p>
      </div>

      <div className="checkout-grid">
        <div className="form-card">
          <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Your details</h3>
          <div className="field">
            <label htmlFor="c-name">Full name <span className="req">*</span></label>
            <input id="c-name" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="field">
              <label htmlFor="c-wa">WhatsApp number <span className="req">*</span></label>
              <input
                id="c-wa"
                inputMode="tel"
                placeholder="+91 9679573542"
                value={form.customerWhatsApp}
                onChange={(e) => set('customerWhatsApp', e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="c-email">Email (optional)</label>
              <input id="c-email" type="email" value={form.customerEmail} onChange={(e) => set('customerEmail', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label>Fulfilment</label>
            <div style={{ display: 'flex', gap: '1.2rem' }}>
              <label className="field-check" style={{ margin: 0 }}>
                <input type="radio" name="method" checked={form.deliveryMethod === 'delivery'} onChange={() => set('deliveryMethod', 'delivery')} />
                Home delivery
              </label>
              <label className="field-check" style={{ margin: 0 }}>
                <input type="radio" name="method" checked={form.deliveryMethod === 'pickup'} onChange={() => set('deliveryMethod', 'pickup')} />
                Local pickup
              </label>
            </div>
          </div>

          {form.deliveryMethod === 'delivery' && (
            <div className="field">
              <label htmlFor="c-addr">Delivery address <span className="req">*</span></label>
              <textarea id="c-addr" rows={3} value={form.deliveryAddress} onChange={(e) => set('deliveryAddress', e.target.value)} />
            </div>
          )}

          <p className="small muted">
            By placing this inquiry you agree to be contacted on WhatsApp. No payment is collected here.
          </p>
        </div>

        <aside>
          <div className="summary-card" style={{ position: 'static', marginBottom: '1rem' }}>
            <h3>Your order ({itemCount})</h3>
            {items.map((i) => (
              <div className="summary-row" key={`${i.productId}-${i.variationsText}`}>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatINR(i.unitPrice * i.quantity)}</span>
              </div>
            ))}
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>To be confirmed</span>
            </div>
            <div className="summary-row total">
              <span>Estimated total</span>
              <span>{formatINR(subtotal)}</span>
            </div>
          </div>

          <button type="button" className="btn btn-whatsapp btn-lg btn-block" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="spinner" /> : <IconCheck width="18" height="18" />}
            {submitting ? 'Saving your inquiry…' : 'Save & open WhatsApp'}
          </button>
          <p className="small muted" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
            <IconWhatsApp width="14" height="14" /> We re-check prices &amp; stock before saving.
          </p>

          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: 'var(--forest)' }}>
              Preview WhatsApp message
            </summary>
            <div className="whatsapp-preview chat-bubble" style={{ marginTop: '0.6rem' }}>
              {previewMessage}
            </div>
          </details>
        </aside>
      </div>
    </div>
  );
}