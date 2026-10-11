// One-time administrator bootstrap script.
// Usage:
//   npm run create-admin
//   ADMIN_EMAIL=a@b.c ADMIN_INITIAL_PASSWORD=... npm run create-admin
//
// In production this script refuses to run unless ADMIN_BOOTSTRAP_ALLOWED=true.
// After the first run, unset the bootstrap environment variables and never
// enable the flag again.

const { connectDatabase, mongoose } = require('../src/config/database');
const Admin = require('../src/models/Admin');
const env = require('../src/config/env');

async function main() {
  const email = (
    process.env.ADMIN_EMAIL ||
    (process.argv[2] || '').split('=')[1] ||
    env.admin.email
  )
    .trim()
    .toLowerCase();
  const password =
    process.env.ADMIN_INITIAL_PASSWORD || env.admin.password;
  const name = process.env.ADMIN_NAME || env.admin.name || 'Studio Admin';

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD in environment.');
    process.exit(1);
  }
  if (password.length < 12 && env.isProd) {
    console.error('For production, use a password of at least 12 characters.');
    process.exit(1);
  }
  if (env.isProd && process.env.ADMIN_BOOTSTRAP_ALLOWED !== 'true') {
    console.error(
      'Bootstrap is disabled in production. Set ADMIN_BOOTSTRAP_ALLOWED=true temporarily to run this once.'
    );
    process.exit(1);
  }

  await connectDatabase();

  const existing = await Admin.findOne({ email }).select('_id email').lean();
  if (existing) {
    console.log(`[seed] An admin with email ${email} already exists. Nothing to do.`);
  } else {
    const passwordHash = await Admin.hashPassword(password);
    await Admin.create({ name, email, passwordHash, role: 'admin', isActive: true });
    console.log(`[seed] Admin created for ${email}.`);
  }

  console.log('[seed] Security note: unset ADMIN_INITIAL_PASSWORD now that setup is done.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});