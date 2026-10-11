import { useEffect, useState } from 'react';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useConfirm } from '../../context/ConfirmContext';
import { PageLoader } from '../../components/Loader';
import SingleImageUploader from '../../components/admin/SingleImageUploader';

const EMPTY = { name: '', slug: '', description: '', sortOrder: 0, imageUrl: '', isActive: true, isRecruitment: false };
const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect width="60" height="60" fill="#FFF2DF"/></svg>`);

export default function AdminCategories() {
  const toast = useToast();
  const confirm = useConfirm();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .get('/admin/categories')
      .then((res) => setCategories(res.data.data.categories))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openNew = () => {
    setEditing('new');
    setForm({ ...EMPTY });
  };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({
      name: c.name || '',
      slug: c.slug || '',
      description: c.description || '',
      sortOrder: c.sortOrder ?? 0,
      imageUrl: c.imageUrl || '',
      isActive: c.isActive !== false,
      isRecruitment: Boolean(c.isRecruitment),
    });
  };
  const close = () => {
    setEditing(null);
    setForm({ ...EMPTY });
  };

  const save = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Category name is required.');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        imageUrl: form.imageUrl,
        isActive: form.isActive,
        isRecruitment: form.isRecruitment,
      };
      if (editing === 'new') {
        await api.post('/admin/categories', payload);
        toast.success('Category created.');
      } else {
        await api.patch(`/admin/categories/${editing}`, payload);
        toast.success('Category updated.');
      }
      close();
      load();
    } catch (err) {
      toast.error(extractError(err, 'Could not save the category.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    const ok = await confirm({
      title: `Delete "${c.name}"?`,
      message: c.productCount
        ? 'This category still has products and cannot be deleted until they are moved.'
        : 'This action cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/admin/categories/${c._id}`);
      toast.success('Category deleted.');
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <>
      <div className="admin-topbar">
        <h1>Categories</h1>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          + Add category
        </button>
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <div className="table-card">
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Products</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <img className="thumb-sm" src={c.imageUrl || FALLBACK} alt={c.name} />
                    </td>
                    <td>
                      <strong>{c.name}</strong>
                      {c.isRecruitment && <span className="badge mint" style={{ marginLeft: 6 }}>recruitment</span>}
                    </td>
                    <td className="small muted">{c.slug}</td>
                    <td>{c.productCount ?? 0}</td>
                    <td>{c.sortOrder ?? 0}</td>
                    <td>
                      <span className={`status-pill ${c.isActive === false ? 'inactive' : 'active'}`}>
                        {c.isActive === false ? 'Hidden' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(c)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing === 'new' ? 'Add category' : 'Edit category'}</h3>
              <button type="button" className="modal-close" onClick={close} aria-label="Close">
                ×
              </button>
            </div>
            <form onSubmit={save}>
              <div className="field">
                <label>Name <span className="req">*</span></label>
                <input value={form.name} onChange={(e) => set('name', e.target.value)} />
              </div>
              <div className="field">
                <label>Slug (optional)</label>
                <input value={form.slug} onChange={(e) => set('slug', e.target.value)} placeholder="auto-generated" />
              </div>
              <div className="field">
                <label>Description (optional)</label>
                <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </div>
              <SingleImageUploader
                label="Category image (optional)"
                folder="tcs-categories"
                value={form.imageUrl}
                onChange={(url) => set('imageUrl', url)}
              />
              <div className="field" style={{ maxWidth: 200 }}>
                <label>Sort order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
              </div>
              <div className="field-check">
                <input id="c-active" type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
                <label htmlFor="c-active" style={{ margin: 0 }}>Visible in shop</label>
              </div>
              <div className="field-check">
                <input
                  id="c-recruit"
                  type="checkbox"
                  checked={form.isRecruitment}
                  onChange={(e) => set('isRecruitment', e.target.checked)}
                />
                <label htmlFor="c-recruit" style={{ margin: 0 }}>Recruitment category</label>
              </div>

              <div className="confirm-actions" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={close}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving && <span className="spinner" />} Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}