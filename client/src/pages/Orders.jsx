import { useEffect, useState } from 'react';
import api, { extractError } from '../services/api';
import { formatINR } from '../utils/format';
import { PageLoader, EmptyState } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import Seo from '../components/Seo';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/orders/my');
        setOrders(res.data.data.orders);
      } catch (err) {
        console.error(extractError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <PageLoader full />;

  return (
    <>
      <Seo title="My Orders — The Creative Studio" path="/orders" />
      <div className="container">
        <div className="page-head">
          <span className="kicker hand">track your happiness</span>
          <h1>My Orders</h1>
          <Squiggle color="#A9DCC7" />
        </div>
        {orders.length === 0 ? (
          <EmptyState emoji="📦" title="No orders yet" text="Your handmade goodies will show up here once placed." />
        ) : (
          <div className="table-card" style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td>{o.orderReference}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td><span className={`status-pill ${o.status}`}>{o.status.replace(/_/g, ' ')}</span></td>
                    <td>{formatINR(o.total ?? o.subtotal)}</td>
                    <td>{o.items?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
