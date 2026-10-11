import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { Squiggle, HeartDoodle } from '../components/Doodles';
import Seo from '../components/Seo';
import { IconWhatsApp } from '../components/Icons';
import { whatsappLink } from '../utils/whatsapp';

export default function About() {
  const { settings } = useSettings();
  const whatsapp = String(settings?.whatsappNumber || '919679573542').replace(/\D/g, '');

  return (
    <div className="container">
      <Seo
        title="About Us"
        description="Meet The Creative Studio — a small handmade studio making personalised gifts, paintings, flower bouquets and printing work with love."
        path="/about"
      />
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          our story
        </span>
        <h1>About The Creative Studio</h1>
        <Squiggle color="#F4A6C1" />
      </div>

      <div className="form-card" style={{ maxWidth: 860, margin: '0 auto' }}>
        <p style={{ fontSize: '1.05rem', color: 'var(--ink-soft)' }}>
          {settings?.aboutText ||
            'The Creative Studio is a small handmade studio that creates personalised gifts, paintings, flower bouquets and printing work — all made with love, just for you.'}
        </p>

        <div className="why-grid" style={{ marginTop: '1.6rem' }}>
          <div className="why-card">
            <div className="emoji">🎨</div>
            <h3>Handmade</h3>
            <p>Every product is crafted by hand, so no two are exactly alike.</p>
          </div>
          <div className="why-card">
            <div className="emoji">💬</div>
            <h3>Personal</h3>
            <p>We plan each order with you over WhatsApp, so it feels just right.</p>
          </div>
          <div className="why-card">
            <div className="emoji">🌼</div>
            <h3>Thoughtful</h3>
            <p>From flowers to hampers to printing — gifts that carry meaning.</p>
          </div>
          <div className="why-card">
            <div className="emoji">💝</div>
            <h3>Made for you</h3>
            <p>Customise colours, text and occasions for a keepsake that lasts.</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem', display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <Link to="/shop" className="btn btn-primary btn-lg">
            Visit the shop
          </Link>
          <a
            className="btn btn-whatsapp btn-lg"
            href={whatsappLink(whatsapp, 'Hello The Creative Studio! I would like to know more about you.')}
            target="_blank"
            rel="noreferrer noopener"
          >
            <IconWhatsApp width="18" height="18" /> Say hello
          </a>
        </div>
        <p className="small muted" style={{ marginTop: '1.4rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          Made with <HeartDoodle size={14} color="#F4A6C1" /> by The Creative Studio.
        </p>
      </div>
    </div>
  );
}