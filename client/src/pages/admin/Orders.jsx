import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { formatINR, formatDate, titleCase } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';
import { PageLoader, EmptyState } from '../../components/Loader';
import { IconSearch, IconDownload, IconEye } from '../../components/Icons';

const STATUSES = [
  '', 'pending_confirmation', 'confirmed', 'processing', 'ready_for_dispatch',
  'shipped', 'completed', 'cancelled',
];

export default function AdminOrders() {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const debounce = useRef();

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: 15 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (from) params.from = from;
    if (to) params.to = to;
    api
      .get('/admin/orders', { params })
      .then((res) => {
        setOrders(res.data.data.orders);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, search, status, from, to]);

  const onSearch = (value) => {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setPage(1), 400);
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await api.get('/admin/orders/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded.');
    } catch (err) {
      toast.error(extractError(err, 'Export failed.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Order inquiries</h1>
        <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={exporting}>
          {exporting ? <span className="spinner" /> : <IconDownload width="16" height="16" />} Export CSV
        </button>
      </div>

      <div className="table-card">
        <div className="tbl-head">
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ minWidth: 220 }}>
              <IconSearch />
              <input
                type="search"
                placeholder="Reference, name or WhatsApp…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <select className="select-sort" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s ? titleCase(s) : 'All statuses'}
                </option>
              ))}
            </select>
            <input
              className="select-sort"
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              aria-label="From date"
            />
            <input
              className="select-sort"
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              aria-label="To date"
            />
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : orders.length === 0 ? (
          <EmptyState emoji="🧾" title="No orders found" text="Inquiries will appear here as customers submit them." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>WhatsApp</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td style={{ fontWeight: 700 }}>{o.orderReference}</td>
                    <td>{o.customerName}</td>
                    <td>{o.customerWhatsApp}</td>
                    <td>{o.items?.length ?? 0}</td>
                    <td>{formatINR(o.subtotal)}</td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td className="small">{formatDate(o.createdAt)}</td>
                    <td>
                      <Link className="icon-action" to={`/admin/orders/${o._id}`} title="View">
                        <IconEye />
                      </Link>
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
    </>
  );
}