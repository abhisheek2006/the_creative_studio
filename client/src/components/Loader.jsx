export function LoaderDots({ label = 'Loading' }) {
  return (
    <div className="spinner-wrap">
      <span className="loader-dots">
        <span />
        <span />
        <span />
      </span>
      <span>{label}…</span>
    </div>
  );
}

export function PageLoader({ full = false }) {
  return (
    <div style={full ? { minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
      <LoaderDots label="Please wait" />
    </div>
  );
}

export function EmptyState({ emoji = '🌷', title, text, action }) {
  return (
    <div className="empty-state">
      <div className="big">{emoji}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}