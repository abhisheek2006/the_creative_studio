import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { whatsappLink } from '../utils/whatsapp';
import ProductCard from '../components/ProductCard';
import QuickViewModal from '../components/QuickViewModal';
import Seo from '../components/Seo';
import { PageLoader } from '../components/Loader';
import { Squiggle, HeartDoodle, StarDoodle } from '../components/Doodles';
import { IconWhatsApp, IconInstagram, IconArrowLeft } from '../components/Icons';

const FALLBACK_CAT =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="#A9DCC7"/></svg>`
  );

const WHY = [
  { emoji: '🎨', title: 'Made by hand', text: 'Every piece is crafted and finished by hand — never mass produced.' },
  { emoji: '💝', title: 'Personalised', text: 'Tell us your idea, colours and occasion. We make it uniquely yours.' },
  { emoji: '📦', title: 'Carefully packed', text: 'Wrapped with love so your gift arrives picture perfect.' },
  { emoji: '💬', title: 'Easy on WhatsApp', text: 'Order, confirm and ask anything with a single message.' },
];

export default function Home() {
  const { settings } = useSettings();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quickView, setQuickView] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get('/products/home');
        if (active) setData(res.data.data);
      } catch (_err) {
        if (active) setData({ featured: [], newArrivals: [], bestSellers: [], categories: [] });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const whatsapp = String(settings?.whatsappNumber || '919679573542').replace(/\D/g, '');
  const instagram = settings?.instagramUrl || 'https://www.instagram.com/the_creativestudio26/';

  if (loading) return <PageLoader full />;

  const heroImages = [
    ...(data?.featured || []).map((p) => p.primaryImage).filter(Boolean),
    ...(data?.newArrivals || []).map((p) => p.primaryImage).filter(Boolean),
  ].slice(0, 2);

  return (
    <>
      <Seo
        title="Handmade Gifts, Custom Paintings & Flower Bouquets"
        description="Shop handmade gifts, custom portrait paintings, forever flower bouquets, gift hampers and printing services at The Creative Studio. Personalised with love."
        path="/"
        image={heroImages[0]}
      />
      {/* HERO */}
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="hero-kicker">
              <HeartDoodle size={24} color="#F4A6C1" /> create · craft · customize
            </span>
            <h1 className="hero-title">
              The Creative <span className="underline">Studio</span>
            </h1>
            <p className="hero-tagline">
              {settings?.tagline || 'Create • Craft • Customize • Share Happiness.'}
            </p>
            <div className="hero-cta">
              <Link to="/shop" className="btn btn-primary btn-lg">
                Shop Now
              </Link>
              <Link to="/custom-order" className="btn btn-lavender btn-lg">
                Custom Order <StarDoodle size={18} color="#25211F" />
              </Link>
            </div>
            <div className="hero-badges">
              <span className="badge pink">
                <HeartDoodle size={14} color="#25211F" /> Handmade with love
              </span>
              <span className="badge mint">Custom gifts</span>
              <span className="badge sky">Flowers & paintings</span>
              <span className="badge yellow">Printing services</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="tilt t1">
              <img src={heroImages[0] || FALLBACK_CAT} alt="Handmade creation" />
            </div>
            <div className="tilt t2">
              <img src={heroImages[1] || FALLBACK_CAT} alt="Handmade bouquet" />
            </div>
            <div className="hero-tag-sticker">
              <div className="sticker">
                handmade
                <br /> just for you
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {data?.categories?.length > 0 && (
        <section>
          <div className="container">
            <div className="section-head">
              <span className="kicker">shop by category</span>
              <h2>Find the perfect gift</h2>
              <Squiggle color="#F4A6C1" />
              <p>From hand-painted portraits to forever flowers — explore what we make with love.</p>
            </div>
            <div className="cat-grid">
              {data.categories.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className={`cat-card ${c.imageUrl ? '' : 'no-img'}`}
                >
                  {c.imageUrl && (
                    <div className="img-wrap">
                      <img src={c.imageUrl} alt={c.name} loading="lazy" />
                    </div>
                  )}
                  <div className={c.imageUrl ? 'label' : ''}>
                    <h3>{c.name}</h3>
                    {!c.imageUrl && <span className="muted small">Tap to explore →</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FEATURED */}
      {data?.featured?.length > 0 && (
        <section style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <span className="kicker">featured</span>
              <h2>Loved &amp; featured picks</h2>
              <Squiggle color="#C6A0F5" />
            </div>
            <div className="prod-grid">
              {data.featured.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/shop" className="btn btn-outline">
                View all products <IconArrowLeft style={{ transform: 'rotate(180deg)' }} width="16" height="16" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* PROMO */}
      <section>
        <div className="container">
          <div className="promo">
            <div>
              <span className="hand" style={{ color: '#F6C75B', fontSize: '1.4rem' }}>
                have something in mind?
              </span>
              <h2>Let's create a custom keepsake together</h2>
              <p>
                Share your idea, occasion, colours and budget. We will craft something personal and
                unforgettable — and confirm everything on WhatsApp.
              </p>
            </div>
            <div className="promo-actions">
              <Link to="/custom-order" className="btn btn-yellow btn-lg">
                Start a custom order
              </Link>
              <a
                className="btn btn-whatsapp btn-lg"
                href={whatsappLink(whatsapp, 'Hello The Creative Studio! I have a custom order idea.')}
                target="_blank"
                rel="noreferrer noopener"
              >
                <IconWhatsApp width="18" height="18" /> Chat now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {data?.newArrivals?.length > 0 && (
        <section style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <span className="kicker">fresh</span>
              <h2>New arrivals</h2>
              <Squiggle color="#A9DCC7" />
            </div>
            <div className="prod-grid">
              {data.newArrivals.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} onQuickView={setQuickView} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BEST SELLERS */}
      {data?.bestSellers?.length > 0 && (
        <section style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <span className="kicker">customer favourites</span>
              <h2>Best sellers</h2>
              <Squiggle color="#F6C75B" />
              <p>Based on real orders recorded at The Creative Studio.</p>
            </div>
            <div className="prod-grid">
              {data.bestSellers.slice(0, 8).map((p) => (
                <ProductCard key={`bs-${p.id}`} product={p} onQuickView={setQuickView} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* REVIEWS — only rendered when genuine reviews exist (none recorded yet) */}
      {Array.isArray(data?.reviews) && data.reviews.length > 0 && (
        <section style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <span className="kicker">kind words</span>
              <h2>What customers say</h2>
              <Squiggle color="#F4A6C1" />
            </div>
            <div className="review-grid">
              {data.reviews.map((r, i) => (
                <div className="review-card" key={i}>
                  <div className="stars">{'★'.repeat(r.rating || 5)}</div>
                  <p>{r.text}</p>
                  <div className="author">{r.name}</div>
                  <div className="meta">{r.location || ''}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* WHY CHOOSE US */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <span className="kicker">why choose us</span>
            <h2>Made with heart, every single time</h2>
            <Squiggle color="#C6A0F5" />
          </div>
          <div className="why-grid">
            {WHY.map((w) => (
              <div className="why-card" key={w.title}>
                <div className="emoji">{w.emoji}</div>
                <h3>{w.title}</h3>
                <p>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="insta-strip">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="insta-logo">◎</span>
              <div>
                <h2>Follow our little studio</h2>
                <p>See fresh creations, behind-the-scenes and new arrivals on Instagram.</p>
              </div>
            </div>
            <a className="btn btn-primary btn-lg" href={instagram} target="_blank" rel="noreferrer noopener">
              <IconInstagram width="18" height="18" /> {settings?.instagramUsername || '@the_creativestudio26'}
            </a>
          </div>
        </div>
      </section>

      {/* WHATSAPP CONTACT */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="promo" style={{ background: '#25d366', color: '#06370f' }}>
            <div>
              <span className="hand" style={{ fontSize: '1.4rem' }}>questions? custom requests?</span>
              <h2 style={{ color: '#06370f' }}>We're one message away</h2>
              <p style={{ color: '#0b4d1c' }}>
                Chat with us directly on WhatsApp for orders, prices, delivery and everything else.
              </p>
            </div>
            <div className="promo-actions">
              <a
                className="btn btn-primary btn-lg"
                href={whatsappLink(whatsapp, 'Hello The Creative Studio! I would like to know more about your products.')}
                target="_blank"
                rel="noreferrer noopener"
              >
                <IconWhatsApp width="18" height="18" /> Message +{whatsapp}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING WHATSAPP */}
      <a
        href={whatsappLink(whatsapp, 'Hello The Creative Studio!')}
        target="_blank"
        rel="noreferrer noopener"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed',
          right: '20px',
          bottom: '20px',
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: '#25d366',
          color: '#06370f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 900,
        }}
      >
        <IconWhatsApp width="30" height="30" />
      </a>

      {quickView && <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />}
    </>
  );
}