const { S3Client } = require('@aws-sdk/client-s3');
const env = require('./env');

let client = null;

/**
 * Cloudflare R2 is S3-compatible. We create a single cached client that talks to
 * the R2 endpoint using the R2 access key / secret. Nothing here throws if R2 is
 * not configured — callers fall back to local disk storage.
 */
function getR2Client() {
  if (!env.r2Enabled) return null;
  if (!client) {
    client = new S3Client({
      region: env.r2.region,
      endpoint: env.r2.endpoint,
      forcePathStyle: env.r2.forcePathStyle,
      credentials: {
        accessKeyId: env.r2.accessKeyId,
        secretAccessKey: env.r2.secretAccessKey,
      },
    });
  }
  return client;
}

function getR2PublicUrl(key) {
  const base = env.r2.publicBaseUrl;
  if (!base) return '';
  return `${base.replace(/\/$/, '')}/${String(key).replace(/^\//, '')}`;
}

module.exports = {
  getR2Client,
  getR2PublicUrl,
  r2Enabled: env.r2Enabled,
  bucket: env.r2.bucket,
};
