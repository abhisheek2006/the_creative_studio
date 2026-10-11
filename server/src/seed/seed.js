// Database bootstrap for development / initial setup.
//   npm run seed                 -> admin + categories + site settings
//   npm run seed -- --demo       -> also seeds sample products + a sample job
// Sample products are clearly placeholder images meant to be replaced by real
// uploads from the admin dashboard.

const { connectDatabase, mongoose } = require('../config/database');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Category = require('../models/Category');
const SiteSettings = require('../models/SiteSettings');
const Product = require('../models/Product');
const JobListing = require('../models/JobListing');
const env = require('../config/env');

const DEFAULT_CATEGORIES = [
  {
    name: 'Painting & Portrait',
    slug: 'painting-portrait',
    description:
      'Custom portraits, original paintings and art made by hand, just for you or as a gift.',
    sortOrder: 1,
    isActive: true,
    isRecruitment: false,
  },
  {
    name: 'Handmade Hampers & Gifts',
    slug: 'handmade-hampers-gifts',
    description:
      'Carefully packed gift hampers for birthdays, anniversaries and every special moment.',
    sortOrder: 2,
    isActive: true,
    isRecruitment: false,
  },
  {
    name: 'Pipe Cleaners Tulip & Flower',
    slug: 'pipe-cleaners-tulip-flower',
    description: 'Charming pipe-cleaner tulips and flowers that never wilt.',
    sortOrder: 3,
    isActive: true,
    isRecruitment: false,
  },
  {
    name: 'Handmade Flower Bouquet',
    slug: 'handmade-flower-bouquet',
    description: 'Handcrafted flower bouquets made with love and lasting beauty.',
    sortOrder: 4,
    isActive: true,
    isRecruitment: false,
  },
  {
    name: 'Assignment & Printing',
    slug: 'assignment-printing',
    description: 'Assignment writing help, printing and documentation services.',
    sortOrder: 5,
    isActive: true,
    isRecruitment: false,
  },
  {
    name: 'Online Recruitment for Islander',
    slug: 'online-recruitment-islander',
    description:
      'A separate portal connecting islanders with verified job opportunities. Browse candidates-friendly listings without any guarantee of employment.',
    sortOrder: 6,
    isActive: true,
    isRecruitment: true,
  },
];

const DEMO_PRODUCTS = [
  {
    name: 'Handmade Flower Bouquet — Pastel Mix',
    category: 'handmade-flower-bouquet',
    price: 499,
    salePrice: 399,
    stockQuantity: 10,
    shortDescription: 'A pastel dream bouquet wrapped in paper, made fully by hand.',
    description:
      'Each handcrafted bouquet is assembled from premium materials and stays beautiful for years. Perfect for birthdays, anniversaries, proposals or "just because".',
    colors: ['Pink', 'Lavender', 'Mint', 'Sky Blue'],
    customizable: true,
    customizationInstructions: 'Tell us your theme, occasion or favourite colours — we will recreate the bouquet around your idea.',
    deliveryInformation: 'Delivery within our city or nearby areas; confirm charges on WhatsApp.',
    isFeatured: true,
    isBestSeller: true,
  },
  {
    name: 'Pipe Cleaners Tulip Bunch',
    category: 'pipe-cleaners-tulip-flower',
    price: 299,
    salePrice: 249,
    stockQuantity: 25,
    shortDescription: 'A cheery clutch of handmade pipe-cleaner tulips in soft colours.',
    description:
      'Hand-twisted pipe-cleaner tulips arranged in a small bunch. A lovely desk or shelf companion that never needs water.',
    colors: ['Pink', 'Yellow', 'Lavender', 'Mint'],
    customizable: true,
    customizationInstructions: 'Pick your favourite colours and quantity and we will craft it for you.',
    deliveryInformation: 'Can be handed over locally or shipped carefully packed.',
    isFeatured: true,
  },
  {
    name: 'Custom Portrait Painting',
    category: 'painting-portrait',
    price: 799,
    salePrice: null,
    stockQuantity: 5,
    shortDescription: 'A hand-painted portrait based on your favourite photo.',
    description:
      'Send us a clear photo and our artists will paint a personalised portrait. Ideal for anniversaries, birthdays and farewells.',
    customizable: true,
    customizationInstructions: 'Upload a clear reference photo and share any style preferences.',
    deliveryInformation: 'Hand-delivered after completion; timeline shared on WhatsApp.',
    isFeatured: true,
  },
  {
    name: 'Birthday Gift Hamper',
    category: 'handmade-hampers-gifts',
    price: 999,
    salePrice: 849,
    stockQuantity: 8,
    shortDescription: 'A personalised hamper filled with handmade goodies.',
    description:
      'Curated hampers with a mix of handmade gifts, treats and personal touches tailored to the recipient.',
    colors: ['Pink', 'Lavender'],
    customizable: true,
    customizationInstructions: 'Tell us the occasion, age group and interests of the person receiving it.',
    deliveryInformation: 'Wrapped and ready to gift; local delivery available.',
    isBestSeller: true,
  },
];

async function seedCategories() {
  for (const c of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ slug: c.slug }).select('_id').lean();
    if (!existing) {
      await Category.create(c);
      console.log(`[seed] Created category: ${c.name}`);
    } else {
      await Category.updateOne({ _id: existing._id }, { $set: c });
    }
  }
}

async function seedAdmin() {
  const email = String(env.admin.email || '').trim().toLowerCase();
  if (!email || !env.admin.password) {
    console.log('[seed] ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD not set — skipping admin creation. Run `npm run create-admin`.');
    return;
  }
  const existing = await Admin.findOne({ email }).select('_id').lean();
  if (existing) {
    console.log('[seed] Admin already exists.');
    return;
  }
  const passwordHash = await bcrypt.hash(env.admin.password, 12);
  await Admin.create({ name: env.admin.name, email, passwordHash, role: 'admin', isActive: true });
  console.log(`[seed] Admin created: ${email}`);
}

async function seedSettings() {
  const settings = await SiteSettings.getSingleton();
  if (!settings.whatsappNumber) settings.whatsappNumber = env.whatsappNumber;
  if (!settings.instagramUrl) settings.instagramUrl = env.instagramUrl;
  await settings.save();
  console.log('[seed] Site settings ready.');
}

async function seedDemoProducts() {
  const categoryMap = {};
  (await Category.find({}).lean()).forEach((c) => { categoryMap[c.slug] = c._id; });

  for (const demo of DEMO_PRODUCTS) {
    const catId = categoryMap[demo.category];
    if (!catId) continue;
    const slug = await Product.buildUniqueSlug(demo.name);
    const imgSeed = encodeURIComponent(demo.name.replace(/[^a-zA-Z0-9 ]/g, ''));
    await Product.create({
      ...demo,
      category: catId,
      slug,
      images: [
        { url: `https://picsum.photos/seed/${imgSeed}/800/800`, publicId: '', alt: demo.name, isPrimary: true },
        { url: `https://picsum.photos/seed/${imgSeed}2/800/800`, publicId: '', alt: `${demo.name} (view 2)`, isPrimary: false },
      ],
      specifications: [
        { key: 'Made by', value: 'The Creative Studio' },
        { key: 'Material', value: 'Handmade premium materials' },
      ],
      status: 'active',
    });
    console.log(`[seed] Created sample product: ${demo.name}`);
  }
}

async function seedSampleJob() {
  const existing = await JobListing.findOne({}).select('_id').lean();
  if (existing) return;
  await JobListing.create({
    title: 'Example Verified Listing',
    employer: 'Local Business Partner',
    description:
      'This is a placeholder record created by the seed script. An administrator should replace or remove it with real, verified openings. There is no guarantee of employment for anyone who applies.',
    eligibility: '18+ years and resident of the island. Specific criteria will be added by the administrator.',
    location: 'Port Blair',
    employmentType: 'full_time',
    isVerified: true,
    status: 'draft',
    contactInformation: 'Ask The Creative Studio on WhatsApp for the employer contact.',
  });
  console.log('[seed] Created an example (draft) job listing — publish only verified openings.');
}

async function main() {
  await connectDatabase();
  await seedCategories();
  await seedSettings();
  await seedAdmin();

  const demo = process.argv.includes('--demo');
  if (demo) {
    await seedDemoProducts();
    await seedSampleJob();
  } else {
    console.log('[seed] Tip: run `npm run seed -- --demo` to also seed sample products.');
  }

  console.log('[seed] Done.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});