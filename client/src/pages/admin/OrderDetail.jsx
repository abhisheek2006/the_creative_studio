import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { formatINR, formatDate, titleCase } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import { PageLoader, EmptyState } from '../../components/Loader';
import { IconWhatsApp } from '../../components/Icons';
import { whatsappLink } from '../../utils/whatsapp';

const STATUSES = [
  'pending_confirmation', 'confirmed', 'processing', 'ready_for_dispatch',
  'shipped', 'completed', 'cancelled',
];

export default function OrderDetail() {
  const { id } = useParams();
  const toast = useToast();
  const { settings } = useSettings();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get(`/admin/orders/${id}`)
      .then((res) => {
        if (!active) return;
        setOrder(res.data.data.order);
        setStatus(res.data.data.order.status);
        setNotes(res.data.data.order.adminNotes || '');
      })
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  const changeStatus = async (next) => {
    setSavingStatus(true);
    try {
      const res = await api.patch(`/admin/orders/${id}/status`, { status: next });
      setOrder(res.data.data.order);
      setStatus(res.data.data.order.status);
      toast.success(res.data.message || 'Status updated.');
    } catch (err) {
      toast.error(extractError(err, 'Could not update status.'));
      setStatus(order.status);
    } finally {
      setSavingStatus(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const res = await api.patch(`/admin/orders/${id}/notes`, { adminNotes: notes });
      setOrder(res.data.data.order);
      toast.success('Notes saved.');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <PageLoader />;
  if (notFound || !order) {
    return (
      <EmptyState
        emoji="🔍"
        title="Order not found"
        action={
          <Link to="/admin/orders" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to orders
          </Link>
        }
      />
    );
  }

  const wa = String(order.customerWhatsApp || '').replace(/\D/g, '');
  const waMessage = `Hello ${order.customerName}, this is The Creative Studio regarding your order ${order.orderReference}.`;

  return (
    <>
      <div className="admin-topbar">
        <div>
          <Link to="/admin/orders" className="small muted">
            ← Back to orders
          </Link>
          <h1>{order.orderReference}</h1>
          <p className="muted small">Placed {formatDate(order.createdAt, true)}</p>
        </div>
        <StatusPill status={order.status} />
      </div>

      <div className="checkout-grid">
        <div>
          <div className="table-card" style={{ marginBottom: '1.2rem' }}>
            <div className="tbl-head">
              <h3>Items</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Variations</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i}>
                      <td>
                        {it.product ? (
                          <Link to={`/product/${it.slug}`} target="_blank" rel="noreferrer" style={{ fontWeight: 700 }}>
                            {it.name}
                          </Link>
                        ) : (
                          <strong>{it.name}</strong>
                        )}
                      </td>
                      <td className="small muted">
                        {it.variations && Object.keys(it.variations).length
                          ? Object.entries(it.variations).map(([k, v]) => `${k}: ${v}`).join(', ')
                          : '—'}
                      </td>
                      <td>{formatINR(it.unitPrice)}</td>
                      <td>{it.quantity}</td>
                      <td>{formatINR(it.lineSubtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="table-card" style={{ marginBottom: '1.2rem' }}>
            <div className="tbl-head">
              <h3>Customer & delivery</h3>
            </div>
            <div style={{ padding: '1rem' }}>
              <p style={{ margin: '0 0 0.4rem' }}><strong>{order.customerName}</strong></p>
              <p className="muted small" style={{ margin: '0 0 0.4rem' }}>
                WhatsApp: {order.customerWhatsApp}
                {order.customerEmail ? ` · ${order.customerEmail}` : ''}
              </p>
              <p className="muted small" style={{ margin: '0 0 0.4rem' }}>
                Method: <b>{titleCase(order.deliveryMethod)}</b>
              </p>
              {order.deliveryAddress && <p className="small" style={{ margin: 0 }}>{order.deliveryAddress}</p>}
            </div>
          </div>

          <div className="table-card">
            <div className="tbl-head">
              <h3>Internal notes</h3>
            </div>
            <div style={{ padding: '1rem' }}>
              <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Private notes for the team…" />
              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '0.6rem' }} onClick={saveNotes} disabled={savingNotes}>
                {savingNotes && <span className="spinner" />} Save notes
              </button>
            </div>
          </div>
        </div>

        <aside>
          <div className="summary-card" style={{ position: 'static', marginBottom: '1.2rem' }}>
            <h3>Update status</h3>
            <select value={status} onChange={(e) => changeStatus(e.target.value)} disabled={savingStatus}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
            <p className="small muted" style={{ marginTop: '0.6rem' }}>
              Stock is deducted when an order leaves “Pending confirmation”, and returned if it is reverted or cancelled.
            </p>
          </div>

          <div className="summary-card" style={{ position: 'static', marginBottom: '1.2rem' }}>
            <h3>Summary</h3>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span>{order.deliveryFeePending ? 'Pending' : formatINR(order.deliveryFee)}</span>
            </div>
            {order.discount > 0 && (
              <div className="summary-row">
                <span>Discount</span>
                <span>-{formatINR(order.discount)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span>Total</span>
              <span>{order.total != null ? formatINR(order.total) : formatINR(order.subtotal)}</span>
            </div>
          </div>

          <a
            className="btn btn-whatsapp btn-block"
            href={whatsappLink(wa || settings?.whatsappNumber, waMessage)}
            target="_blank"
            rel="noreferrer noopener"
          >
            <IconWhatsApp width="18" height="18" /> Message customer
          </a>
        </aside>
      </div>
    </>
  );
}