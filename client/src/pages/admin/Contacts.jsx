import { useEffect, useRef, useState } from 'react';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatDate, titleCase } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';
import { PageLoader, EmptyState } from '../../components/Loader';
import { IconSearch, IconMail, IconPhone, IconEye } from '../../components/Icons';

const STATUSES = ['new', 'read', 'replied', 'archived'];

export default function AdminContacts() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState(null);
  const [notes, setNotes] = useState('');
  const debounce = useRef();

  const load = () => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (status) params.status = status;
    api
      .get('/admin/contacts', { params })
      .then((res) => {
        setItems(res.data.data.messages);
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

  const openDetail = async (item) => {
    setDetail(item);
    setNotes(item.adminNotes || '');
    if (item.status === 'new') {
      try {
        const res = await api.patch(`/admin/contacts/${item._id}/status`, { status: 'read' });
        setDetail(res.data.data.message);
        load();
      } catch {
        /* non-blocking */
      }
    }
  };

  const updateStatus = async (next) => {
    try {
      const res = await api.patch(`/admin/contacts/${detail._id}/status`, { status: next, adminNotes: notes });
      setDetail(res.data.data.message);
      toast.success('Message updated.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const saveNotes = async () => {
    try {
      await api.patch(`/admin/contacts/${detail._id}/status`, { status: detail.status, adminNotes: notes });
      toast.success('Notes saved.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Messages</h1>
      </div>

      <div className="table-card">
        <div className="tbl-head">
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ minWidth: 220 }}>
              <IconSearch />
              <input type="search" placeholder="Name, email or subject…" value={search} onChange={(e) => onSearch(e.target.value)} />
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
          <EmptyState emoji="✉️" title="No messages" text="Contact form messages will appear here." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>From</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m._id}>
                    <td>
                      <strong>{m.name}</strong>
                      <div className="small muted">{m.email || m.phone || '—'}</div>
                    </td>
                    <td>{m.subject}</td>
                    <td>
                      <StatusPill status={m.status} />
                    </td>
                    <td className="small">{formatDate(m.createdAt)}</td>
                    <td>
                      <button type="button" className="icon-action" title="View" onClick={() => openDetail(m)}>
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
          <div className="modal" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>{detail.subject}</h3>
                <span className="small muted">From {detail.name}</span>
              </div>
              <button type="button" className="modal-close" onClick={() => setDetail(null)} aria-label="Close">
                ×
              </button>
            </div>

            <div className="action-row" style={{ marginBottom: '0.9rem' }}>
              {detail.email && (
                <a className="btn btn-outline btn-sm" href={`mailto:${detail.email}?subject=Re: ${encodeURIComponent(detail.subject)}`}>
                  <IconMail width="15" height="15" /> Reply by email
                </a>
              )}
              {detail.phone && (
                <a className="btn btn-outline btn-sm" href={`tel:${detail.phone}`}>
                  <IconPhone width="15" height="15" /> Call
                </a>
              )}
            </div>

            <p style={{ whiteSpace: 'pre-line', background: 'var(--cream-soft)', padding: '1rem', borderRadius: 12 }}>
              {detail.message}
            </p>

            <div className="field" style={{ marginTop: '1rem' }}>
              <label>Status</label>
              <select value={detail.status} onChange={(e) => updateStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Internal notes</label>
              <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="confirm-actions" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-primary" onClick={saveNotes}>
                Save notes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}