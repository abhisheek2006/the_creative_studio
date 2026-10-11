import { useState } from 'react';
import api, { extractError } from '../services/api';
import { formatINR, formatDate } from '../utils/format';
import StatusPill from '../components/StatusPill';
import { Squiggle } from '../components/Doodles';
import { IconSearch } from '../components/Icons';

export default function TrackOrder() {
  const [reference, setReference] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOrder(null);
    const ref = reference.trim().toUpperCase();
    if (!/^TCS-\d{8}-[A-Z0-9]{6}$/.test(ref)) {
      setError('Enter a reference like TCS-20261010-ABC123.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/orders/reference/${ref}`);
      setOrder(res.data.data);
    } catch (err) {
      setError(extractError(err, 'We could not find that reference.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          order status
        </span>
        <h1>Track Your Inquiry</h1>
        <Squiggle color="#C6A0F5" />
        <p>Enter the order reference you received when you placed your inquiry.</p>
      </div>

      <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: 560, margin: '0 auto' }}>
        <div className="field">
          <label htmlFor="ref">Order reference</label>
          <input
            id="ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="TCS-20261010-ABC123"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spinner" /> : <IconSearch width="18" height="18" />} Track
        </button>
        {error && <div className="error-banner" style={{ marginTop: '1rem', marginBottom: 0 }}>{error}</div>}
      </form>

      {order && (
        <div className="form-card" style={{ maxWidth: 680, margin: '1.4rem auto 0' }}>
          <div className="flex-btw">
            <h3 style={{ color: 'var(--forest)' }}>{order.orderReference}</h3>
            <StatusPill status={order.status} />
          </div>
          <p className="muted small">Placed on {formatDate(order.createdAt, true)}</p>

          {order.items.map((it, i) => (
            <div className="summary-row" key={i}>
              <span>
                {it.name} × {it.quantity}
              </span>
              <span>{formatINR(it.lineSubtotal)}</span>
            </div>
          ))}
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatINR(order.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>{order.deliveryFeePending ? 'To be confirmed' : formatINR(order.deliveryFee)}</span>
          </div>
          <div className="summary-row total">
            <span>{order.deliveryFeePending ? 'Estimated total' : 'Total'}</span>
            <span>{formatINR(order.total ?? order.subtotal)}</span>
          </div>
          <p className="small muted" style={{ marginTop: '1rem' }}>
            Statuses are updated by our team. For questions, please message us on WhatsApp.
          </p>
        </div>
      )}
    </div>
  );
}