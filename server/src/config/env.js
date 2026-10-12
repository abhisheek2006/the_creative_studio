const path = require('path');
const dotenv = require('dotenv');

// Load env from the project root first, then server/.env as a fallback.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodbUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'insecure-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  cookieSecure: toBool(process.env.COOKIE_SECURE, process.env.NODE_ENV === 'production'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  whatsappNumber: process.env.WHATSAPP_NUMBER || '919679573542',
  instagramUrl: process.env.INSTAGRAM_URL || 'https://www.instagram.com/the_creativestudio26/',
  currency: process.env.CURRENCY || 'INR',
  r2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET_NAME || '',
    region: process.env.R2_REGION || 'auto',
    // Endpoint can be provided explicitly; otherwise derive it from the account id.
    endpoint:
      process.env.R2_ENDPOINT ||
      (process.env.R2_ACCOUNT_ID
        ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
        : ''),
    // Public base URL (r2.dev dev URL or a custom domain) used to build image links.
    publicBaseUrl: process.env.R2_PUBLIC_URL || process.env.R2_PUBLIC_BASE_URL || '',
    forcePathStyle: toBool(process.env.R2_FORCE_PATH_STYLE, true),
  },
  maxImageMb: parseInt(process.env.MAX_IMAGE_MB || '5', 10),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    // Stored as a single line with literal "\n" escapes.
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  admin: {
    name: process.env.ADMIN_NAME || 'Studio Admin',
    email: process.env.ADMIN_EMAIL || '',
    password: process.env.ADMIN_INITIAL_PASSWORD || '',
  },
};

env.isProd = env.nodeEnv === 'production';
env.isVercel = Boolean(process.env.VERCEL);
env.r2Enabled = Boolean(
  env.r2.accessKeyId && env.r2.secretAccessKey && env.r2.bucket && env.r2.endpoint
);
env.firebaseEnabled = Boolean(
  env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey
);

module.exports = env;
