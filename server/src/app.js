const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const env = require('./config/env');
const { connectDatabase } = require('./config/database');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimit');
const { uploadsDir } = require('./services/uploadService');

const app = express();

app.set('trust proxy', 1);

// Secure HTTP headers (exclude cross-origin policies so rest APIs are simple).
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // The SPA is served from this origin in local/single-server mode and loads
    // product images from external CDNs (Cloudflare R2 / placeholders), so the
    // default restrictive CSP would block them. Matches Vercel, where the static
    // client is served by the CDN without this header.
    contentSecurityPolicy: false,
  })
);

// CORS — applied to the API only. Approved origins (and same-origin requests,
// e.g. the built SPA served by this server) may call the API with credentials.
// Scoping this to `/api` keeps static assets/routes out of the origin check.
app.use('/api', (req, res, next) => {
  const selfHost = req.get('host');
  const options = {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      let originHost = '';
      try {
        originHost = new URL(origin).host;
      } catch (_err) {
        originHost = '';
      }
      if (originHost && originHost === selfHost) return callback(null, true);
      if (env.allowedOrigins.includes(origin)) return callback(null, true);
      // In development, accept any localhost / 127.0.0.1 origin (any port) so the
      // Vite dev server keeps working when it lands on 5174, via 127.0.0.1, etc.
      if (!env.isProd && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
  return cors(options)(req, res, next);
});

app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());

// Local-dev fallback: serve uploaded images from disk when Cloudflare R2 is not configured.
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

if (env.nodeEnv !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check (does not require the database).
app.get('/api/health', (_req, res) => {
  res.status(200).json({ success: true, data: { healthy: true, service: 'tcs-api', env: env.nodeEnv } });
});

// Connect to MongoDB before handling API traffic (connection is cached serverless-wide).
app.use(async (req, res, next) => {
  try {
    await connectDatabase();
    next();
  } catch (err) {
    next(err);
  }
});

// General API rate guard (admin login has its own stricter limiter).
app.use('/api', apiLimiter);

app.use('/api', routes);

// Serve the built React client (client/dist) at the root when present so a
// single server shows the whole app (mirrors the Vercel SPA rewrite). API and
// upload paths are excluded from the SPA fallback so they keep returning JSON.
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist, { maxAge: '1h' }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;