import { useEffect, useState } from 'react';
import api, { extractError } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useSettings } from '../../context/SettingsContext';
import { PageLoader } from '../../components/Loader';
import SingleImageUploader from '../../components/admin/SingleImageUploader';
import { IconSearch } from '../../components/Icons';

const EMPTY = {
  businessName: '',
  tagline: '',
  logoUrl: '',
  logoPublicId: '',
  whatsappNumber: '',
  instagramUrl: '',
  instagramUsername: '',
  currency: 'INR',
  contactEmail: '',
  contactPhone: '',
  address: '',
  deliveryInformation: '',
  announcementBarText: '',
  footerText: '',
  aboutText: '',
  defaultDeliveryFee: '',
  freeDeliveryThreshold: '',
  socialLinks: { facebook: '', youtube: '', twitter: '' },
  featuredProductIds: [],
};

export default function AdminSettings() {
  const toast = useToast();
  const { setSettings } = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get('/admin/settings')
      .then((res) => {
        const s = res.data.data.settings;
        setForm({
          ...EMPTY,
          ...s,
          defaultDeliveryFee: s.defaultDeliveryFee ?? '',
          freeDeliveryThreshold: s.freeDeliveryThreshold ?? '',
          socialLinks: { ...EMPTY.socialLinks, ...(s.socialLinks || {}) },
          featuredProductIds: (s.featuredProductIds || []).map(String),
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    api
      .get('/admin/products', { params: { status: 'active', limit: 100, sort: 'name-asc' } })
      .then((res) => setProducts(res.data.data.products))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSocial = (k, v) => setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [k]: v } }));

  const toggleFeatured = (id) => {
    setForm((f) => {
      const has = f.featuredProductIds.includes(id);
      if (has) return { ...f, featuredProductIds: f.featuredProductIds.filter((x) => x !== id) };
      if (f.featuredProductIds.length >= 12) {
        toast.error('You can feature up to 12 products.');
        return f;
      }
      return { ...f, featuredProductIds: [...f.featuredProductIds, id] };
    });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        businessName: form.businessName.trim(),
        tagline: form.tagline.trim(),
        logoUrl: form.logoUrl,
        logoPublicId: form.logoPublicId,
        whatsappNumber: form.whatsappNumber,
        instagramUrl: form.instagramUrl.trim(),
        instagramUsername: form.instagramUsername.trim(),
        currency: form.currency.trim() || 'INR',
        contactEmail: form.contactEmail.trim(),
        contactPhone: form.contactPhone.trim(),
        address: form.address.trim(),
        deliveryInformation: form.deliveryInformation.trim(),
        announcementBarText: form.announcementBarText.trim(),
        footerText: form.footerText.trim(),
        aboutText: form.aboutText.trim(),
        defaultDeliveryFee: form.defaultDeliveryFee === '' ? null : Number(form.defaultDeliveryFee),
        freeDeliveryThreshold: form.freeDeliveryThreshold === '' ? null : Number(form.freeDeliveryThreshold),
        socialLinks: form.socialLinks,
        featuredProductIds: form.featuredProductIds,
      };
      const res = await api.put('/admin/settings', payload);
      const saved = res.data.data.settings;
      setForm((f) => ({
        ...f,
        logoPublicId: saved.logoPublicId || f.logoPublicId,
        featuredProductIds: (saved.featuredProductIds || f.featuredProductIds).map(String),
      }));
      const pub = await api.get('/settings/public').catch(() => null);
      if (pub) setSettings(pub.data.data.settings);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(extractError(err, 'Could not save settings.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase().trim())
  );

  return (
    <>
      <div className="admin-topbar">
        <h1>Site settings</h1>
      </div>

      <form onSubmit={save}>
        <div className="form-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Brand</h3>
          <SingleImageUploader
            label="Logo"
            folder="tcs-brand"
            value={form.logoUrl}
            onChange={(url, publicId) =>
              setForm((f) => ({ ...f, logoUrl: url, logoPublicId: publicId ?? f.logoPublicId }))
            }
          />
          <div className="field">
            <label>Business name</label>
            <input value={form.businessName} onChange={(e) => set('businessName', e.target.value)} />
          </div>
          <div className="field">
            <label>Tagline</label>
            <input value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </div>
          <div className="field">
            <label>Announcement bar text</label>
            <input value={form.announcementBarText} onChange={(e) => set('announcementBarText', e.target.value)} />
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Contact & social</h3>
          <div className="form-row">
            <div className="field">
              <label>WhatsApp number (with country code)</label>
              <input value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} placeholder="919679573542" />
            </div>
            <div className="field">
              <label>Currency</label>
              <input value={form.currency} onChange={(e) => set('currency', e.target.value)} placeholder="INR" />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Contact email</label>
              <input value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
            </div>
            <div className="field">
              <label>Contact phone</label>
              <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Instagram URL</label>
              <input value={form.instagramUrl} onChange={(e) => set('instagramUrl', e.target.value)} />
            </div>
            <div className="field">
              <label>Instagram username</label>
              <input value={form.instagramUsername} onChange={(e) => set('instagramUsername', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Facebook URL</label>
              <input value={form.socialLinks.facebook} onChange={(e) => setSocial('facebook', e.target.value)} />
            </div>
            <div className="field">
              <label>YouTube URL</label>
              <input value={form.socialLinks.youtube} onChange={(e) => setSocial('youtube', e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Twitter / X URL</label>
            <input value={form.socialLinks.twitter} onChange={(e) => setSocial('twitter', e.target.value)} />
          </div>
          <div className="field">
            <label>Address</label>
            <textarea rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>Delivery & content</h3>
          <div className="form-row">
            <div className="field">
              <label>Default delivery fee (₹, optional)</label>
              <input
                type="number"
                min="0"
                value={form.defaultDeliveryFee}
                onChange={(e) => set('defaultDeliveryFee', e.target.value)}
                placeholder="Leave blank to confirm on WhatsApp"
              />
            </div>
            <div className="field">
              <label>Free delivery threshold (₹, optional)</label>
              <input
                type="number"
                min="0"
                value={form.freeDeliveryThreshold}
                onChange={(e) => set('freeDeliveryThreshold', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Delivery information</label>
            <textarea rows={3} value={form.deliveryInformation} onChange={(e) => set('deliveryInformation', e.target.value)} />
          </div>
          <div className="field">
            <label>About text</label>
            <textarea rows={4} value={form.aboutText} onChange={(e) => set('aboutText', e.target.value)} />
          </div>
          <div className="field">
            <label>Footer text</label>
            <textarea rows={2} value={form.footerText} onChange={(e) => set('footerText', e.target.value)} />
          </div>
        </div>

        <div className="form-card" style={{ marginBottom: '1.4rem' }}>
          <h3 style={{ color: 'var(--forest)', marginBottom: '0.4rem' }}>Featured products</h3>
          <p className="small muted" style={{ marginTop: 0 }}>
            {form.featuredProductIds.length} selected · up to 12 shown on the homepage.
          </p>
          <div className="search-box" style={{ marginBottom: '0.8rem' }}>
            <IconSearch />
            <input type="search" placeholder="Search products…" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
          </div>
          <div
            style={{
              maxHeight: 280,
              overflowY: 'auto',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '0.6rem',
            }}
          >
            {filteredProducts.length === 0 ? (
              <p className="muted small" style={{ margin: '0.6rem' }}>No active products found.</p>
            ) : (
              filteredProducts.map((p) => (
                <label
                  key={p._id}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem 0.5rem', cursor: 'pointer' }}
                >
                  <input
                    type="checkbox"
                    checked={form.featuredProductIds.includes(String(p._id))}
                    onChange={() => toggleFeatured(String(p._id))}
                  />
                  <span>{p.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex-btw">
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
            {saving && <span className="spinner" />} Save settings
          </button>
        </div>
      </form>
    </>
  );
}