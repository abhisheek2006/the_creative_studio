import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatINR, formatDate } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import { PageLoader } from '../../components/Loader';

const CARDS = [
  { key: 'activeProducts', label: 'Active products', tone: '' },
  { key: 'pendingOrders', label: 'Pending inquiries', tone: 'yellow' },
  { key: 'confirmedOrders', label: 'Confirmed orders', tone: 'sky' },
  { key: 'categories', label: 'Categories', tone: 'lavender' },
  { key: 'customOrders', label: 'Custom requests', tone: 'pink' },
  { key: 'pendingCustomOrders', label: 'Pending custom', tone: 'yellow' },
  { key: 'activeJobs', label: 'Active job listings', tone: 'sky' },
  { key: 'unreadContacts', label: 'New messages', tone: 'pink' },
  { key: 'lowStock', label: 'Low-stock products', tone: 'lavender' },
  { key: 'totalOrders', label: 'Total inquiries', tone: '' },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .get('/admin/dashboard/stats')
      .then((res) => active && setStats(res.data.data))
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <PageLoader />;

  return (
    <>
      <div className="stat-grid">
        {CARDS.map((c) => (
          <div className={`stat-card ${c.tone}`} key={c.key}>
            <div className="num">{stats?.[c.key] ?? 0}</div>
            <div className="lbl">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="table-card">
        <div className="tbl-head">
          <h3>Recent inquiries</h3>
          <Link to="/admin/orders" className="btn btn-outline btn-sm">
            View all
          </Link>
        </div>
        {stats?.recentOrders?.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td>
                      <Link to={`/admin/orders/${o._id}`} style={{ fontWeight: 700, color: 'var(--forest)' }}>
                        {o.orderReference}
                      </Link>
                    </td>
                    <td>{o.customerName}</td>
                    <td>{formatINR(o.subtotal)}</td>
                    <td>
                      <StatusPill status={o.status} />
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted" style={{ padding: '1.4rem' }}>
            No order inquiries yet. They will appear here as customers place them.
          </p>
        )}
      </div>

      <div className="flex-btw" style={{ flexWrap: 'wrap', gap: '0.7rem' }}>
        <Link to="/admin/products/new" className="btn btn-primary">
          + Add new product
        </Link>
        <Link to="/admin/jobs" className="btn btn-outline">
          Manage recruitment
        </Link>
        <Link to="/admin/settings" className="btn btn-outline">
          Site settings
        </Link>
      </div>
    </>
  );
}