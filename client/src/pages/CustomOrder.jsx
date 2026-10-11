import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { extractError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { Squiggle } from '../components/Doodles';
import Seo from '../components/Seo';
import { IconWhatsApp, IconCheck } from '../components/Icons';
import { whatsappLink, buildCustomOrderMessage } from '../utils/whatsapp';

const PRODUCT_TYPES = [
  'Painting / Portrait',
  'Gift hamper',
  'Pipe cleaner flowers',
  'Flower bouquet',
  'Other handmade gift',
  'Printing / assignment',
];

const EMPTY = {
  customerName: '',
  whatsappNumber: '',
  email: '',
  productType: '',
  occasion: '',
  preferredColor: '',
  budget: '',
  quantity: 1,
  requiredDate: '',
  customizationDetails: '',
};

export default function CustomOrder() {
  const toast = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const validate = () => {
    if (form.customerName.trim().length < 2) return 'Please enter your name.';
    if (String(form.whatsappNumber).replace(/\D/g, '').length < 8) return 'Please enter a valid WhatsApp number.';
    if (!form.productType) return 'Please choose a product type.';
    if (form.customizationDetails.trim().length < 10) return 'Please describe your idea in a little more detail.';
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) return toast.error(error);

    setSubmitting(true);
    try {
      let referenceImageUrl = '';
      if (file) {
        const formData = new FormData();
        formData.append('image', file);
        const uploadRes = await api.post('/uploads/public', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        referenceImageUrl = uploadRes.data.data.url;
      }

      const res = await api.post('/custom-orders', {
        ...form,
        quantity: Number(form.quantity) || 1,
        requiredDate: form.requiredDate || null,
        referenceImageUrl,
      });
      const data = res.data.data;

      const message = buildCustomOrderMessage({
        referenceNumber: data.referenceNumber,
        customerName: data.customerName,
        whatsappNumber: data.whatsappNumber,
        productType: data.productType,
        occasion: data.occasion,
        preferredColor: data.preferredColor,
        budget: data.budget,
        quantity: data.quantity,
        requiredDate: data.requiredDate,
        customizationDetails: data.customizationDetails,
      });

      window.open(whatsappLink(settings?.whatsappNumber || '919679573542', message), '_blank');
      setResult({ referenceNumber: data.referenceNumber, message });
      setForm(EMPTY);
      setFile(null);
      toast.success('Your custom order request has been saved.');
    } catch (err) {
      toast.error(extractError(err, 'Could not submit your request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="container">
        <div className="page-head">
          <span className="kicker hand" style={{ color: 'var(--forest)' }}>
            request received
          </span>
          <h1>Thank you!</h1>
          <Squiggle color="#A9DCC7" />
        </div>
        <div className="form-card" style={{ maxWidth: 680, margin: '0 auto' }}>
          <div className="success-banner">
            <strong>Reference {result.referenceNumber}</strong>
            <p style={{ margin: '0.4rem 0 0' }}>
              Your custom order request is saved. WhatsApp has been opened with the details — please review
              and press Send. We will get back to you with feasibility and pricing.
            </p>
          </div>
          <div className="whatsapp-preview chat-bubble">{result.message}</div>
          <div className="pd-actions" style={{ marginTop: '1rem' }}>
            <a
              className="btn btn-whatsapp btn-lg"
              href={whatsappLink(settings?.whatsappNumber || '919679573542', result.message)}
              target="_blank"
              rel="noreferrer noopener"
            >
              <IconWhatsApp width="18" height="18" /> Open WhatsApp again
            </a>
            <Link to="/shop" className="btn btn-outline btn-lg">
              Browse the shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Seo
        title="Custom Order Request"
        description="Request a custom handmade gift, painting, flower bouquet or hamper. Share your idea and The Creative Studio will craft something personal for you."
        path="/custom-order"
      />
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          let's create together
        </span>
        <h1>Custom Order Request</h1>
        <Squiggle color="#C6A0F5" />
        <p>Tell us your idea and we will craft something personal, then confirm everything on WhatsApp.</p>
      </div>

      <form className="form-card" style={{ maxWidth: 820, margin: '0 auto' }} onSubmit={handleSubmit} noValidate>
        <h3 style={{ color: 'var(--forest)', marginBottom: '1rem' }}>About you</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="cu-name">Your name <span className="req">*</span></label>
            <input id="cu-name" value={form.customerName} onChange={(e) => set('customerName', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cu-wa">WhatsApp number <span className="req">*</span></label>
            <input
              id="cu-wa"
              inputMode="tel"
              placeholder="+91 9679573542"
              value={form.whatsappNumber}
              onChange={(e) => set('whatsappNumber', e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="cu-email">Email (optional)</label>
          <input id="cu-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>

        <h3 style={{ color: 'var(--forest)', margin: '1.2rem 0 1rem' }}>Your idea</h3>
        <div className="form-row">
          <div className="field">
            <label htmlFor="cu-type">Product type <span className="req">*</span></label>
            <select id="cu-type" value={form.productType} onChange={(e) => set('productType', e.target.value)}>
              <option value="">Select…</option>
              {PRODUCT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="cu-occasion">Occasion</label>
            <input id="cu-occasion" value={form.occasion} onChange={(e) => set('occasion', e.target.value)} placeholder="Birthday, wedding, farewell…" />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cu-color">Preferred colours</label>
            <input id="cu-color" value={form.preferredColor} onChange={(e) => set('preferredColor', e.target.value)} placeholder="Pink, mint, gold…" />
          </div>
          <div className="field">
            <label htmlFor="cu-budget">Budget (₹, optional)</label>
            <input id="cu-budget" type="number" min="0" value={form.budget} onChange={(e) => set('budget', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="cu-qty">Quantity</label>
            <input id="cu-qty" type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="cu-date">Required by</label>
            <input id="cu-date" type="date" value={form.requiredDate} onChange={(e) => set('requiredDate', e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label htmlFor="cu-details">Customization details <span className="req">*</span></label>
          <textarea
            id="cu-details"
            rows={4}
            value={form.customizationDetails}
            onChange={(e) => set('customizationDetails', e.target.value)}
            placeholder="Describe size, colours, names, text, references — anything that helps us imagine your gift."
          />
        </div>

        <div className="field">
          <label htmlFor="cu-file">Reference image (optional)</label>
          <input id="cu-file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <span className="hint">JPG/PNG up to 5MB.</span>
        </div>

        <button type="submit" className="btn btn-whatsapp btn-lg btn-block" disabled={submitting}>
          {submitting ? <span className="spinner" /> : <IconCheck width="18" height="18" />}
          {submitting ? 'Submitting…' : 'Submit & continue on WhatsApp'}
        </button>
        <p className="small muted" style={{ textAlign: 'center', marginTop: '0.6rem' }}>
          Your request is saved even if you don't send the WhatsApp message.
        </p>
      </form>
    </div>
  );
}