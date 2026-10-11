const crypto = require('crypto');

function dateStamp(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function randomCode(length = 6) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) out += chars[bytes[i] % chars.length];
  return out;
}

// e.g. TCS-20261010-ABC123
function generateOrderReference() {
  return `TCS-${dateStamp()}-${randomCode(6)}`;
}

// e.g. CUS-20261010-ABC123
function generateCustomOrderReference() {
  return `CUS-${dateStamp()}-${randomCode(6)}`;
}

function generateCheckoutRequestId() {
  return crypto.randomUUID();
}

module.exports = {
  dateStamp,
  randomCode,
  generateOrderReference,
  generateCustomOrderReference,
  generateCheckoutRequestId,
};
