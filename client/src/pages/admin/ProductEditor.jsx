import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import ProductForm from '../../components/admin/ProductForm';
import { PageLoader, EmptyState } from '../../components/Loader';

export default function ProductEditor() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const toast = useToast();

  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/admin/categories').then((res) => setCategories(res.data.data.categories)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isNew) return;
    let active = true;
    setLoading(true);
    api
      .get(`/admin/products/${id}`)
      .then((res) => active && setProduct(res.data.data.product))
      .catch(() => active && setNotFound(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, isNew]);

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      if (isNew) {
        const res = await api.post('/admin/products', payload);
        toast.success('Product created.');
        navigate(`/admin/products/${res.data.data.product._id}/edit`, { replace: true });
      } else {
        const res = await api.patch(`/admin/products/${id}`, payload);
        setProduct(res.data.data.product);
        toast.success('Product updated.');
      }
    } catch (err) {
      toast.error(extractError(err, 'Could not save the product.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader />;
  if (notFound) {
    return (
      <EmptyState
        emoji="🔍"
        title="Product not found"
        text="It may have been deleted."
        action={
          <Link to="/admin/products" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Back to products
          </Link>
        }
      />
    );
  }

  return (
    <>
      <div className="admin-topbar">
        <h1>{isNew ? 'Add new product' : 'Edit product'}</h1>
        <Link to="/admin/products" className="btn btn-outline">
          ← Back to products
        </Link>
      </div>

      <ProductForm
        product={product}
        categories={categories}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel={isNew ? 'Create product' : 'Save changes'}
      />
    </>
  );
}