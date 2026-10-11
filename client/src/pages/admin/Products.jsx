import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { formatINR, formatDate } from '../../utils/format';
import StatusPill from '../../components/StatusPill';
import Pagination from '../../components/Pagination';
import { PageLoader, EmptyState } from '../../components/Loader';
import { IconSearch, IconEdit, IconEye, IconTrash } from '../../components/Icons';

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="#FFF2DF"/></svg>`
  );

export default function AdminProducts() {
  const toast = useToast();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const debounce = useRef();

  const load = () => {
    setLoading(true);
    const params = { page, sort, limit: 12 };
    if (search) params.search = search;
    if (status) params.status = status;
    if (category) params.category = category;
    api
      .get('/admin/products', { params })
      .then((res) => {
        setProducts(res.data.data.products);
        setPagination(res.data.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    api.get('/admin/categories').then((res) => setCategories(res.data.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort, status, category, search]);

  const onSearch = (value) => {
    setSearch(value);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => setPage(1), 400);
  };

  const setProductStatus = async (product, newStatus) => {
    try {
      await api.patch(`/admin/products/${product._id}/status`, { status: newStatus });
      toast.success(`Product marked as ${newStatus}.`);
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const archive = async (product) => {
    const ok = await confirm({
      title: 'Archive this product?',
      message: 'It will be hidden from the shop but order history is preserved.',
      confirmLabel: 'Archive',
      danger: true,
    });
    if (ok) setProductStatus(product, 'archived');
  };

  const remove = async (product) => {
    const ok = await confirm({
      title: 'Permanently delete?',
      message: `"${product.name}" will be deleted and cannot be recovered. Consider archiving instead.`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/products/${product._id}`);
      toast.success('Product deleted.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary">
          + Add new product
        </Link>
      </div>

      <div className="table-card">
        <div className="tbl-head">
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-box" style={{ minWidth: 220 }}>
              <IconSearch />
              <input
                type="search"
                placeholder="Search products…"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
              />
            </div>
            <select className="select-sort" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select className="select-sort" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
              <option value="low-stock">Low stock</option>
            </select>
            <select className="select-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="name-asc">Name A–Z</option>
              <option value="price">Price</option>
              <option value="stock">Stock</option>
            </select>
          </div>
        </div>

        {loading ? (
          <PageLoader />
        ) : products.length === 0 ? (
          <EmptyState
            emoji="📦"
            title="No products found"
            text="Try adjusting your filters, or add your first product."
            action={
              <Link to="/admin/products/new" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                + Add new product
              </Link>
            }
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const primary = (p.images || []).find((i) => i.isPrimary) || (p.images || [])[0];
                  return (
                    <tr key={p._id}>
                      <td>
                        <img className="thumb-sm" src={primary?.url || FALLBACK} alt={p.name} />
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="small muted">{p.slug}</div>
                      </td>
                      <td>{p.category?.name || '—'}</td>
                      <td>
                        {formatINR(p.salePrice != null ? p.salePrice : p.price)}
                        {p.salePrice != null && (
                          <div className="small muted" style={{ textDecoration: 'line-through' }}>
                            {formatINR(p.price)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ color: p.stockQuantity <= 5 ? 'var(--red)' : 'inherit', fontWeight: 700 }}>
                          {p.stockQuantity}
                        </span>
                      </td>
                      <td>
                        <StatusPill status={p.status} />
                      </td>
                      <td className="small">{formatDate(p.createdAt)}</td>
                      <td>
                        <div className="action-row">
                          <button
                            type="button"
                            className="icon-action"
                            title="Edit"
                            onClick={() => navigate(`/admin/products/${p._id}/edit`)}
                          >
                            <IconEdit />
                          </button>
                          <a
                            className="icon-action"
                            title="Preview in shop"
                            href={`/product/${p.slug}`}
                            target="_blank"
                            rel="noreferrer noopener"
                          >
                            <IconEye />
                          </a>
                          {p.status === 'active' ? (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title="Deactivate"
                              onClick={() => setProductStatus(p, 'inactive')}
                            >
                              Hide
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              title="Activate"
                              onClick={() => setProductStatus(p, 'active')}
                            >
                              Show
                            </button>
                          )}
                          {p.status !== 'archived' && (
                            <button type="button" className="btn btn-ghost btn-sm" onClick={() => archive(p)}>
                              Archive
                            </button>
                          )}
                          <button type="button" className="icon-action danger" title="Delete" onClick={() => remove(p)}>
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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