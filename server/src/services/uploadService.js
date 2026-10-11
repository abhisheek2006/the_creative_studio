const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getR2Client, getR2PublicUrl, bucket } = require('../config/r2');
const env = require('../config/env');

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

// Remote object keys are stored with this prefix so we can tell them apart from
// local-disk files (which use a "local:" prefix) when deleting.
const LOCAL_PREFIX = 'local:';

// ---------- Cloudflare R2 (production / persistent storage) ----------
async function uploadToR2(buffer, { folder = 'tcs', filename = 'image', contentType } = {}) {
  const client = getR2Client();
  if (!client) return null;

  const ext = path.extname(filename || '').toLowerCase();
  const suffix = ALLOWED_EXT.has(ext) ? ext : EXT_BY_MIME[contentType] || '.jpg';
  const base = path
    .basename(filename || 'image', path.extname(filename || ''))
    .replace(/[^a-zA-Z0-9.\-_]/g, '')
    .slice(0, 60) || 'image';
  const key = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}-${base}${suffix}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || EXT_BY_MIME[suffix] || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return { url: getR2PublicUrl(key), publicId: key };
}

async function deleteFromR2(key) {
  if (!key) return;
  const client = getR2Client();
  if (!client) return;
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// ---------- Local filesystem fallback (development only) ----------
const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

function storeLocally(buffer, filename) {
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2)}-${String(filename).replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
  const filePath = path.join(uploadsDir, safe);
  fs.writeFileSync(filePath, buffer);
  return {
    url: `/uploads/${safe}`,
    publicId: `${LOCAL_PREFIX}${safe}`,
  };
}

async function deleteLocal(publicId) {
  const key = String(publicId || '').replace(LOCAL_PREFIX, '');
  if (!key) return;
  const filePath = path.join(uploadsDir, key);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (_err) {
    // Ignore missing files.
  }
}

// ---------- Unified helpers ----------
async function uploadImage(buffer, options = {}) {
  const filename = options.filename || 'image.jpg';
  const r2Result = await uploadToR2(buffer, { ...options, filename });
  if (r2Result && r2Result.url) return r2Result;
  return storeLocally(buffer, filename);
}

async function deleteImage(publicId) {
  if (!publicId) return;
  if (publicId.startsWith(LOCAL_PREFIX)) {
    await deleteLocal(publicId);
  } else {
    await deleteFromR2(publicId);
  }
}

function validateImageFile(file, maxBytes) {
  const mimeOk = ALLOWED_MIME.has(file.mimetype);
  const ext = path.extname(file.originalname || '').toLowerCase();
  const extOk = ALLOWED_EXT.has(ext);
  const sizeOk = file.size <= maxBytes;
  if (!mimeOk || !extOk) {
    return { ok: false, message: 'Only JPG, PNG, WEBP, GIF or AVIF images are allowed.' };
  }
  if (!sizeOk) {
    return {
      ok: false,
      message: `Image must be ${Math.round(maxBytes / (1024 * 1024))}MB or smaller.`,
    };
  }
  return { ok: true };
}

module.exports = {
  ALLOWED_MIME,
  ALLOWED_EXT,
  uploadImage,
  deleteImage,
  validateImageFile,
  uploadsDir,
  r2Enabled: env.r2Enabled,
};
