import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { extractError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loader';
import { Squiggle } from '../components/Doodles';
import Seo from '../components/Seo';

export default function Profile() {
  const { user, loading: authLoading, refreshMe } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch('/auth/me', { name: form.name, phone: form.phone });
      await refreshMe();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(extractError(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <PageLoader full />;

  return (
    <>
      <Seo title="My Profile — The Creative Studio" path="/profile" />
      <div className="container">
        <div className="page-head">
          <span className="kicker hand">your space</span>
          <h1>My Profile</h1>
          <Squiggle color="#C6A0F5" />
        </div>
        <div className="form-card" style={{ maxWidth: 620 }}>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" value={user?.email || ''} readOnly disabled />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </button>
            <Link to="/orders" className="btn btn-outline" style={{ marginLeft: 8 }}>My Orders</Link>
          </form>
        </div>
      </div>
    </>
  );
}
