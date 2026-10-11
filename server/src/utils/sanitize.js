// Escapes user input used in regex queries to prevent ReDoS / injection.
function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeWhatsApp(raw) {
  return String(raw || '').replace(/[^\d]/g, '');
}

module.exports = { escapeRegex, normalizeWhatsApp };
