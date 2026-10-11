import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Logo, HeartDoodle } from './Doodles';
import { IconCart, IconMenu, IconClose, IconInstagram, IconWhatsApp } from './Icons';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/shop', label: 'Shop' },
  { to: '/custom-order', label: 'Custom Order' },
  { to: '/jobs', label: 'Jobs' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { itemCount } = useCart();
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const whatsapp = settings?.whatsappNumber || '919679573542';
  const instagram = settings?.instagramUrl || 'https://www.instagram.com/the_creativestudio26/';

  return (
    <>
      <div className="announcement">
        <HeartDoodle size={18} color="#F4A6C1" />
        <span>{settings?.announcementBarText || 'Handmade with Love, Just for You.'}</span>
        <HeartDoodle size={18} color="#F4A6C1" />
      </div>

      <header className="navbar">
        <div className="container nav-inner">
          <Link to="/" className="brand" onClick={() => setOpen(false)}>
            <Logo />
            <span>
              The Creative <b>Studio</b>
            </span>
          </Link>

          <nav className="nav-links" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <a
              className="icon-btn"
              href={instagram}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Instagram"
            >
              <IconInstagram />
            </a>
            <a
              className="icon-btn"
              href={`https://wa.me/${String(whatsapp).replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="WhatsApp"
            >
              <IconWhatsApp width="22" height="22" />
            </a>
            <Link to="/cart" className="icon-btn" aria-label={`Cart, ${itemCount} items`}>
              <IconCart />
              {itemCount > 0 && <span className="cart-badge">{itemCount > 99 ? '99+' : itemCount}</span>}
            </Link>
            <button
              type="button"
              className="icon-btn burger"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
              aria-expanded={open}
            >
              <IconMenu />
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-menu" onClick={() => setOpen(false)}>
          <div className="mobile-menu-panel" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="icon-btn mobile-close"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <IconClose />
            </button>
            <div className="brand" style={{ marginBottom: '1rem' }}>
              <Logo />
              <span>
                The Creative <b>Studio</b>
              </span>
            </div>
            {LINKS.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <Link to="/cart" onClick={() => setOpen(false)}>
              Cart {itemCount > 0 ? `(${itemCount})` : ''}
            </Link>
            <div style={{ marginTop: '1.4rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <a
                className="btn btn-whatsapp btn-sm"
                href={`https://wa.me/${String(whatsapp).replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer noopener"
              >
                <IconWhatsApp width="16" height="16" /> WhatsApp
              </a>
              <Link className="btn btn-outline btn-sm" to="/admin/login" onClick={() => setOpen(false)}>
                Admin
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}