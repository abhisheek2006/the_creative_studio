// Vercel Serverless entry point.
// All /api/* traffic (see vercel.json rewrites) is handled by the Express app.
const app = require('../server/src/app');

module.exports = app;
