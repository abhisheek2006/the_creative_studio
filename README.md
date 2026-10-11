# The Creative Studio (TCS)

Handmade gifts, paintings, flowers, printing services & islander recruitment.
A full-stack React + Vite storefront with an Express / MongoDB backend, image
storage on **Cloudflare R2**, WhatsApp-based ordering, and a protected admin
dashboard. Deployable on **Vercel**.

- WhatsApp: `919679573542`
- Instagram: [@the_creativestudio26](https://www.instagram.com/the_creativestudio26/)

---

## Tech stack

| Layer     | Choice                                                       |
| --------- | ------------------------------------------------------------ |
| Frontend  | React 18 + Vite + React Router (JavaScript, no TypeScript)   |
| Backend   | Node.js + Express                                            |
| Database  | MongoDB Atlas via Mongoose                                   |
| Images    | Cloudflare R2 (S3-compatible) — local disk fallback in dev   |
| Auth      | JWT in an httpOnly cookie + Bearer fallback                  |
| Hosting   | Vercel (static client + serverless `/api` function)          |

---

## Project structure

```
TCS/
├─ api/index.js            # Vercel serverless entry (exports the Express app)
├─ vercel.json             # Build + rewrite config
├─ server/
│  ├─ scripts/create-admin.js
│  └─ src/
│     ├─ app.js            # Express app (helmet, cors, routes, error handling)
│     ├─ server.js         # Local server bootstrap w/ graceful shutdown
│     ├─ config/           # env.js, database.js, r2.js
│     ├─ models/           # Admin, Category, Product, Order, CustomOrder,
│     │                    # JobListing, ContactMessage, SiteSettings
│     ├─ middleware/       # auth, validate, rateLimit, upload, errorHandler
│     ├─ controllers/      # public + admin controllers
│     ├─ routes/           # public.routes.js, admin.routes.js
│     ├─ services/         # tokenService, uploadService (R2)
│     ├─ utils/            # response, reference, sanitize, productMapper, ...
│     └─ seed/seed.js      # default categories/settings/admin (+ optional demo)
└─ client/
   ├─ src/
   │  ├─ pages/            # public pages + pages/admin/*
   │  ├─ components/       # shared + admin UI
   │  ├─ context/          # Cart, Auth, Toast, Settings, Confirm
   │  ├─ services/api.js   # axios instance + error helper
   │  └─ utils/            # whatsapp message builders, formatters
   └─ vite.config.js       # dev proxy /api + /uploads -> :5000
```

---

## Local setup

### 1. Install dependencies

```bash
npm install                 # root (backend) deps
npm run install:client      # client deps  (or: npm --prefix client install)
```

### 2. Configure environment

Copy `.env.example` to `.env` in the project root and fill in the values:

```bash
cp .env.example .env
```

Key variables:

| Variable          | Notes                                                        |
| ----------------- | ------------------------------------------------------------ |
| `MONGODB_URI`     | MongoDB Atlas connection string (use a restricted DB user)   |
| `JWT_SECRET`      | A long random secret string                                  |
| `COOKIE_SAMESITE` | `lax` locally, `none` for cross-site prod (requires HTTPS)   |
| `COOKIE_SECURE`   | `false` locally, `true` in production                        |
| `FRONTEND_URL`    | `http://localhost:5173` locally                              |
| `R2_*`            | Cloudflare R2 credentials (see below)                        |

### 3. Cloudflare R2 (image storage)

Create a bucket (e.g. `tcs-product-images`), then an **R2 API token** with
Object Read & Write on that bucket, and set:

```
R2_ACCOUNT_ID=<your account id>
R2_ACCESS_KEY_ID=<access key id>
R2_SECRET_ACCESS_KEY=<secret access key>
R2_BUCKET_NAME=tcs-product-images
R2_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com   # optional; derived from account id
R2_PUBLIC_URL=https://<your-public-domain>                  # r2.dev dev URL or a custom domain
```

`R2_PUBLIC_URL` must be publicly readable (enable public access / use a custom
domain) so uploaded images render on the storefront. If any `R2_*` value is
missing, uploads transparently fall back to local disk under `server/uploads/`
(development only — not persistent on Vercel).

### 4. Bootstrap the database

```bash
npm run seed              # 6 default categories + settings + admin account
npm run seed -- --demo    # also add sample products + a draft job listing
```

The seed reads `ADMIN_EMAIL` / `ADMIN_INITIAL_PASSWORD` from `.env` to create
the first admin. To create/reset an admin any other time:

```bash
npm run create-admin
```

> There is intentionally **no public admin registration**. In production the
> bootstrap script refuses to run unless `ADMIN_BOOTSTRAP_ALLOWED=true`.

### 5. Run

```bash
npm run dev          # backend on :5000 (nodemon)
npm run dev:client   # client on :5173 (proxies /api -> :5000)
```

Open http://localhost:5173 for the shop and http://localhost:5173/admin/login
for the dashboard.

---

## API overview

Base path: `/api`. All responses use `{ success, data | message, details? }`.

**Public** — `/products`, `/products/:slug`, `/products/home`,
`/categories`, `/categories/:slug`, `/orders`, `/orders/reference/:reference`,
`/custom-orders`, `/uploads/public`, `/contact`, `/jobs`, `/jobs/:slug`,
`/settings/public`, `/health`.

**Admin** (require auth) — `/admin/auth/*`, `/admin/dashboard/stats`,
`/admin/products*`, `/admin/categories*`, `/admin/orders*`
(+ `/admin/orders/export` CSV), `/admin/custom-orders*`, `/admin/contacts*`,
`/admin/jobs*`, `/admin/settings`, `/admin/uploads`.

### Ordering flow (WhatsApp)

1. Customer builds a cart (persisted in `localStorage`), or uses **Buy Now**.
2. `POST /api/orders` re-validates prices & stock server-side and returns an
   order with a reference like `TCS-20261010-ABC123`.
3. Client sends the order details to the studio on WhatsApp.
4. Checkout is **idempotent** — each submission carries a `checkoutRequestId`
   (UUID); retries return the existing order instead of creating duplicates.
5. Stock is deducted only when an admin moves an order out of
   `pending_confirmation`; it is returned if the order is reverted or cancelled.

Order statuses: `pending_confirmation → confirmed → processing →
ready_for_dispatch → shipped → completed` (or `cancelled`).

---

## Deployment (Vercel)

1. Push the repository to GitHub and import it in Vercel.
2. `vercel.json` already configures:
   - build: `npm run build` (installs + builds the client into `client/dist`)
   - output: `client/dist`
   - rewrites: `/api/*` → `api/index.js`, everything else → `/index.html`
3. Add the environment variables from `.env` in **Project → Settings →
   Environment Variables** (set `NODE_ENV=production`, `COOKIE_SECURE=true`, and
   `COOKIE_SAMESITE=none` if the client and API are on different domains).
4. Deploy. Run the seed once against the production database (locally, pointing
   at the same `MONGODB_URI`) to create categories + the admin account.

---

## Scripts

| Script                  | Purpose                                        |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Backend in watch mode (nodemon)                |
| `npm start`             | Backend (production)                           |
| `npm run dev:client`    | Vite dev server                                |
| `npm run build`         | Install + build the client for production      |
| `npm run seed`          | Seed default data (`-- --demo` for samples)    |
| `npm run create-admin`  | Create/reset an admin account                  |

---

## Notes & conventions

- Backend totals are always authoritative; the client cart is never trusted.
- Reviews on the homepage render only when real review data exists (there is no
  reviews backend yet — none are fabricated).
- Job listings are real, admin-created data and are public only when both
  `isVerified` and `status: "published"`. Never publish unverified listings.
- Secrets live in `.env` (git-ignored) and Vercel env vars — never in source.
