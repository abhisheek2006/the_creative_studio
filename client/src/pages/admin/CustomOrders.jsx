import { useEffect, useRef, useState } from 'react';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDate, titleCase } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';
import { PageLoader, EmptyState } from '../../components/Loader';
import { IconSearch, IconWhatsApp, IconEye } from '../../components/Icons';
import { whatsappLink } from '../../utils/whatsapp';

const STATUSES = [
  'pending_confirmation', 'in_review', 'quoted', 'confirmed', 'in_progress', 'completed', 'cancelled',
];

export default function AdminCustomOrders() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const debounce = useRef();

  const load = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (status) params.status = status;
    api
      .get('/admin/custom-orders', { params })
      .then((res) => {
        setItems(res.data.data.customOrders);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, [page, search, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSearch = (value) => {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setPage(1), 400);
  };

  const openDetail = (item) => {
    setDetail(item);
    setNotes(item.adminNotes || '');
  };

  const changeStatus = async (next) => {
    try {
      const res = await api.patch(`/admin/custom-orders/${detail._id}/status`, { status: next });
      setDetail(res.data.data.customOrder);
      toast.success('Status updated.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await api.patch(`/admin/custom-orders/${detail._id}/notes`, { adminNotes: notes });
      toast.success('Notes saved.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Custom order requests</h1>
      </div>

      <div className="table-card">
        <div className="tbl-head">
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ minWidth: 220 }}>
              <IconSearch />
              <input
                type="search"
                placeholder="Reference, name, product…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <select className="select-sort" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {titleCase(s)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : items.length === 0 ? (
          <EmptyState emoji="🎁" title="No custom requests" text="Custom order requests will appear here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Product type</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it._id}>
                    <td style={{ fontWeight: 700 }}>{it.referenceNumber}</td>
                    <td>{it.customerName}</td>
                    <td>{it.productType}</td>
                    <td>{it.budget != null ? formatINR(it.budget) : '—'}</td>
                    <td>
                      <StatusPill status={it.status} />
                    </td>
                    <td className="small">{formatDate(it.createdAt)}</td>
                    <td>
                      <button type="button" className="icon-action" title="View" onClick={() => openDetail(it)}>
                        <IconEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination && (
          <div style={{ padding: '1rem' }}>
            <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {detail && (
        <div className="modal-backdrop" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{detail.referenceNumber}</h3>
                <StatusPill status={detail.status} />
              </div>
              <button type="button" className="modal-close" onClick={() => setDetail(null)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="form-card" style={{ boxShadow: 'none', padding: 0 }}>
              <p style={{ margin: '0 0 0.4rem' }}><strong>{detail.customerName}</strong></p>
              <p className="small muted" style={{ margin: '0 0 0.8rem' }}>
                WhatsApp: {detail.whatsappNumber}
                {detail.email ? ` · ${detail.email}` : ''}
              </p>
              <div className="form-row">
                <p className="small"><b>Product:</b> {detail.productType}</p>
                <p className="small"><b>Occasion:</b> {detail.occasion || '—'}</p>
              </div>
              <div className="form-row">
                <p className="small"><b>Color:</b> {detail.preferredColor || '—'}</p>
                <p className="small"><b>Qty:</b> {detail.quantity}</p>
              </div>
              <div className="form-row">
                <p className="small"><b>Budget:</b> {detail.budget != null ? formatINR(detail.budget) : '—'}</p>
                <p className="small"><b>Needed by:</b> {detail.requiredDate ? formatDate(detail.requiredDate) : '—'}</p>
              </div>
              <p className="small" style={{ whiteSpace: 'pre-line', marginTop: '0.6rem' }}>
                <b>Details:</b> {detail.customizationDetails}
              </p>
              {detail.referenceImageUrl && (
                <img
                  src={detail.referenceImageUrl}
                  alt="Reference"
                  style={{ maxWidth: 220, borderRadius: 12, marginTop: '0.6rem' }}
                />
              )}

              <div className="field" style={{ marginTop: '1rem' }}>
                <label>Status</label>
                <select value={detail.status} onChange={(e) => changeStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {titleCase(s)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label>Internal notes</label>
                <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>

              <div className="confirm-actions" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <a
                  className="btn btn-whatsapp"
                  href={whatsappLink(detail.whatsappNumber, `Hello ${detail.customerName}, this is The Creative Studio about your custom request ${detail.referenceNumber}.`)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <IconWhatsApp width="18" height="18" /> WhatsApp
                </a>
                <button type="button" className="btn btn-primary" onClick={saveNotes} disabled={savingNotes}>
                  {savingNotes && <span className="spinner" />} Save notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}