import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Logo, HeartDoodle } from './Doodles';
import { IconInstagram, IconWhatsApp, IconMail, IconPhone } from './Icons';

export default function Footer() {
  const { settings } = useSettings();
  const whatsapp = String(settings?.whatsappNumber || '919679573542').replace(/\D/g, '');
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="brand">
              <Logo />
              <span>{settings?.businessName || 'The Creative Studio'}</span>
            </div>
            <p style={{ color: '#c9dcd3', maxWidth: 300 }}>
              {settings?.footerText || 'Handmade gifts, paintings, flowers and printing services made with love.'}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
              <a className="icon-btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer noopener" aria-label="WhatsApp">
                <IconWhatsApp width="20" height="20" />
              </a>
              <a className="icon-btn" href={settings?.instagramUrl || '#'} target="_blank" rel="noreferrer noopener" aria-label="Instagram">
                <IconInstagram />
              </a>
            </div>
          </div>

          <div>
            <h4>Explore</h4>
            <Link to="/shop">Shop all</Link>
            <Link to="/custom-order">Custom order</Link>
            <Link to="/jobs">Recruitment</Link>
          </div>

          <div>
            <h4>Company</h4>
            <Link to="/about">About us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/cart">Your cart</Link>
            <Link to="/admin/login">Admin login</Link>
          </div>

          <div>
            <h4>Get in touch</h4>
            <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer noopener">
              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <IconWhatsApp width="16" height="16" /> +{whatsapp}
              </span>
            </a>
            {settings?.contactEmail && (
              <a href={`mailto:${settings.contactEmail}`}>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  <IconMail width="16" height="16" /> {settings.contactEmail}
                </span>
              </a>
            )}
            {settings?.contactPhone && (
              <a href={`tel:${settings.contactPhone}`}>
                <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                  <IconPhone width="16" height="16" /> {settings.contactPhone}
                </span>
              </a>
            )}
            {settings?.address && <p style={{ color: '#c9dcd3' }}>{settings.address}</p>}
          </div>
        </div>

        <div className="footer-bottom">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            © {year} {settings?.businessName || 'The Creative Studio'}. Made with
            <HeartDoodle size={14} color="#F4A6C1" /> for you.
          </span>
          <span className="policy-links">
            <Link to="/policies#delivery">Delivery</Link>
            <Link to="/policies#returns">Returns</Link>
            <Link to="/policies#privacy">Privacy</Link>
            <Link to="/policies#terms">Terms</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}