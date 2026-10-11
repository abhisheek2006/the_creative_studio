import { useState } from 'react';
import api, { extractError } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useSettings } from '../context/SettingsContext';
import { Squiggle } from '../components/Doodles';
import Seo from '../components/Seo';
import { IconWhatsApp, IconMail, IconPhone, IconCheck } from '../components/Icons';
import { whatsappLink } from '../utils/whatsapp';

export default function Contact() {
  const toast = useToast();
  const { settings } = useSettings();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const whatsapp = String(settings?.whatsappNumber || '919679573542').replace(/\D/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) return toast.error('Please enter your name.');
    if (form.subject.trim().length < 2) return toast.error('Please enter a subject.');
    if (form.message.trim().length < 5) return toast.error('Please enter your message.');
    setSubmitting(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      toast.success('Thank you! Your message has been received.');
    } catch (err) {
      toast.error(extractError(err, 'Could not send your message.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <Seo
        title="Contact Us"
        description="Questions, custom requests or a hello — reach The Creative Studio on WhatsApp, email or through our contact form."
        path="/contact"
      />
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          say hello
        </span>
        <h1>Contact Us</h1>
        <Squiggle color="#A9DCC7" />
        <p>Questions, custom requests or just a hello — we'd love to hear from you.</p>
      </div>

      <div className="checkout-grid">
        <div className="form-card">
          {sent ? (
            <div className="success-banner">
              <strong>Message received!</strong>
              <p style={{ margin: '0.4rem 0 0' }}>
                We'll get back to you soon. You can also reach us instantly on WhatsApp.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="ct-name">Name <span className="req">*</span></label>
                  <input id="ct-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="ct-phone">Phone (optional)</label>
                  <input id="ct-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="ct-email">Email (optional)</label>
                <input id="ct-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ct-subject">Subject <span className="req">*</span></label>
                <input id="ct-subject" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="ct-message">Message <span className="req">*</span></label>
                <textarea id="ct-message" rows={5} value={form.message} onChange={(e) => set('message', e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                {submitting ? <span className="spinner" /> : <IconCheck width="18" height="18" />}
                {submitting ? 'Sending…' : 'Send message'}
              </button>
            </form>
          )}
        </div>

        <aside>
          <div className="summary-card" style={{ position: 'static' }}>
            <h3>Reach us directly</h3>
            <a
              className="btn btn-whatsapp btn-block"
              style={{ marginBottom: '0.8rem' }}
              href={whatsappLink(whatsapp, 'Hello The Creative Studio!')}
              target="_blank"
              rel="noreferrer noopener"
            >
              <IconWhatsApp width="18" height="18" /> WhatsApp +{whatsapp}
            </a>
            {settings?.contactEmail && (
              <a className="btn btn-outline btn-block" style={{ marginBottom: '0.8rem' }} href={`mailto:${settings.contactEmail}`}>
                <IconMail width="16" height="16" /> {settings.contactEmail}
              </a>
            )}
            {settings?.contactPhone && (
              <a className="btn btn-outline btn-block" style={{ marginBottom: '0.8rem' }} href={`tel:${settings.contactPhone}`}>
                <IconPhone width="16" height="16" /> {settings.contactPhone}
              </a>
            )}
            {settings?.instagramUrl && (
              <a className="btn btn-outline btn-block" href={settings.instagramUrl} target="_blank" rel="noreferrer noopener">
                {settings?.instagramUsername || 'Instagram'}
              </a>
            )}
            {settings?.address && <p className="muted small" style={{ marginTop: '1rem' }}>{settings.address}</p>}
            <p className="small muted" style={{ marginTop: '0.6rem' }}>{settings?.deliveryInformation}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}