export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages <= 1) return null;

  const pages = [];
  const push = (p) => pages.push(p);
  const first = Math.max(1, page - 2);
  const last = Math.min(totalPages, page + 2);

  if (first > 1) {
    push(1);
    if (first > 2) push('...left');
  }
  for (let p = first; p <= last; p += 1) push(p);
  if (last < totalPages) {
    if (last < totalPages - 1) push('...right');
    push(totalPages);
  }

  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        ‹
      </button>
      {pages.map((p) =>
        typeof p === 'string' ? (
          <span key={p} className="muted" style={{ padding: '0 0.3rem' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={p === page ? 'active' : ''}
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        ›
      </button>
    </nav>
  );
}