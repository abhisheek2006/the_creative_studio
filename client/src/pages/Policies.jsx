import { Squiggle } from '../components/Doodles';
import Seo from '../components/Seo';

const SECTIONS = [
  {
    id: 'delivery',
    title: 'Delivery & Pickup',
    body: 'Delivery charges are confirmed on WhatsApp based on your location and the size of your order. Some items can be handed over locally or collected as pickup. Timelines for handmade and custom items are shared individually.',
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    body: 'Because most items are handmade and made to order, returns are considered case by case. If your item arrives damaged, please contact us on WhatsApp within 48 hours with photos so we can make it right. Custom and personalised items cannot be returned unless faulty.',
  },
  {
    id: 'privacy',
    title: 'Privacy',
    body: 'We collect only the details you share with us (name, WhatsApp number, address) to fulfil your order and respond to your inquiries. Your information is stored securely and is never sold. You may ask us to delete your details at any time.',
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    body: 'All orders are confirmed after a WhatsApp conversation. We are a small handmade studio, so colours and finishes may vary slightly from photos. Prices and availability may change. Placing an inquiry does not guarantee order confirmation until we reply.',
  },
];

export default function Policies() {
  return (
    <div className="container">
      <Seo
        title="Policies — Delivery, Returns, Privacy & Terms"
        description="The Creative Studio policies: delivery and pickup, returns and refunds, privacy, and terms of service for handmade and custom orders."
        path="/policies"
      />
      <div className="page-head">
        <span className="kicker hand" style={{ color: 'var(--forest)' }}>
          good to know
        </span>
        <h1>Policies</h1>
        <Squiggle color="#F4A6C1" />
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        {SECTIONS.map((s) => (
          <section className="form-card" id={s.id} key={s.id} style={{ scrollMarginTop: '90px' }}>
            <h2 style={{ color: 'var(--forest)', fontSize: '1.35rem' }}>{s.title}</h2>
            <p style={{ color: 'var(--ink-soft)' }}>{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}