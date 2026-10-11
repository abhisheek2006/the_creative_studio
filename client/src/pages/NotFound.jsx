import { Link } from 'react-router-dom';
import { Squiggle } from '../components/Doodles';

export default function NotFound() {
  return (
    <div className="container">
      <div className="empty-state" style={{ padding: '6rem 1rem' }}>
        <div className="big">🌸</div>
        <h1 style={{ color: 'var(--forest)' }}>Oops, page not found</h1>
        <Squiggle color="#F4A6C1" />
        <p style={{ color: 'var(--ink-soft)', marginTop: '0.6rem' }}>
          The page you're looking for may have moved or no longer exists.
        </p>
        <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'center', marginTop: '1.4rem', flexWrap: 'wrap' }}>
          <Link to="/" className="btn btn-primary btn-lg">
            Back home
          </Link>
          <Link to="/shop" className="btn btn-outline btn-lg">
            Visit the shop
          </Link>
        </div>
      </div>
    </div>
  );
}