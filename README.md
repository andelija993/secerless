# Šećerless 🍰

https://secerless.netlify.app/

A bilingual (English / Serbian) recipe blog and food-story site with full
write-ups, a blog, an admin CMS, user accounts, favorites and a contact form.

```
Secerless/
  backend/     Express REST API, Prisma schema + migrations, seed, import scripts
  frontend/    Astro site with React islands, Tailwind + daisyUI, EN/SR i18n
```

## Tech stack

| Area | Stack |
|---|---|
| Backend | Node.js, Express 5, PostgreSQL, Prisma 7 (`@prisma/adapter-pg`), JWT + bcrypt, Cloudinary, Multer, Nodemailer |
| Frontend | Astro 7 (static build), React 19 islands, Tailwind CSS 4, daisyUI 5, `marked` (Markdown) |

## Getting started

### Backend
```bash
cd backend
cp .env.example .env    # fill in the values (see below)
npm install
npm run db:migrate      # apply migrations
npm run db:seed         # admin user, categories, sample content
npm run dev             # http://localhost:4000
```

| Variable | Purpose |
|---|---|
| `PORT` | API port (default `4000`) |
| `FRONTEND_URL` | Allowed CORS origin (default `http://localhost:4321`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Token signing and lifetime (default `7d`). The server refuses to start unless the secret is random and at least 32 characters. Generate one with `openssl rand -hex 32` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin account created by `db:seed`. If no password is given, a random one is generated and printed once |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Image and video hosting |
| `CONTACT_TO` | Where contact-form messages are emailed |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Outgoing mail. For Gmail, use an App Password. If unset, messages are only saved to the database |
| `NETLIFY_BUILD_HOOK` | Production only. Admin content changes trigger a site rebuild (debounced 60 s) |

Backend scripts: `dev`, `start`, `build` (Prisma generate + apply migrations, used on deploy), `db:migrate`, `db:generate`, `db:studio`, `db:seed`.

Secrets live only in `backend/.env`, which is git-ignored. Never commit it.

### Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:4321
npm run build           # static build into dist/
```

| Variable | Purpose |
|---|---|
| `PUBLIC_API_URL` | API URL used by the browser (default `http://localhost:4000/api`; `/api` in production) |
| `API_URL` | Absolute API URL used while building pages (defaults to `PUBLIC_API_URL`) |

> The site is built as static pages. Recipe and blog detail pages are generated at build time from
> **published** content, so publishing new content requires a rebuild. Login, favorites, the profile
> and the admin dashboard load data in the browser.

## Deployment (free tier)

| Part | Host | Config |
|---|---|---|
| Frontend | Netlify | `frontend/netlify.toml` |
| Backend | Render (free web service) | `render.yaml` |
| Database | Neon (free PostgreSQL) or any hosted PostgreSQL | `DATABASE_URL` |
| Media | Cloudinary (free) | `CLOUDINARY_*` |

Netlify proxies `/api/*` to the backend, so the browser only talks to one domain and the httpOnly login cookie stays first-party (browsers block cross-site cookies).

1. **Database:** use a hosted PostgreSQL database (this project uses Neon). For a brand-new database, run `npm run db:seed` once from `backend/` with `DATABASE_URL` pointing at it. Note that the seed also adds sample recipes and posts.
2. **Backend (Render):** New → Blueprint → select this repository.
   - Fill in the variables Render asks for. Set `FRONTEND_URL` to the Netlify site URL.
   - `JWT_SECRET` is generated automatically.
   - Each deploy runs `npm run build`, which applies pending migrations.
   - Check `https://<service>.onrender.com/api/health`.
3. **Admin password:** set a strong one with `node scripts/set-password.mjs <admin email>` (from `backend/`; it prompts for the new password).
4. **Frontend (Netlify):** Add new site → import this repository. Set **Base directory** to `frontend`; the build settings come from `netlify.toml`.
   - Add the environment variable `API_URL=https://<service>.onrender.com/api`.
   - If the Render service isn't called `secerless`, update the proxy target in `netlify.toml`.
5. **Auto-publish:** in Netlify → Site configuration → Build hooks, create a hook. Set its URL as `NETLIFY_BUILD_HOOK` on Render. Admin edits are then published automatically about a minute later.

Notes:
- Render's free service sleeps after 15 minutes without traffic, so the first request after a pause can take up to a minute.
- A build fails on purpose if it can't reach the API, so an empty site is never published. Retry the deploy once the backend is awake.

---

## What's built: backend

### Data model (`backend/prisma/schema.prisma`)
1. **User**: email, bcrypt password hash, first and last name, avatar URL, role `USER` / `ADMIN`.
2. **Category**: name and slug. Seeded set: breakfast, lunch, dinner, drink, dessert, healthy-dessert, ice-cream.
3. **Recipe**:
   - EN and SR title and description, slug, cover image with vertical framing (`imagePosY`), optional video.
   - `instagramId` for imported recipes, a manual `position`, a homepage `featured` flag, `published`.
4. **Ingredient / Step**: one row per line, EN `text` and SR `textSr`, ordered. A line starting with `## ` is a section heading.
5. **RecipeImage**: gallery photos with caption, order and vertical framing.
6. **BlogPost**: EN and SR title and Markdown content, cover image, `published`, `publishedAt`.
7. **Favorite**: user ↔ recipe, unique per pair.
8. **Comment**: stores contact-form messages; it can also link to a recipe or post.

Migrations, in order:
1. `init`
2. `add_recipe_gallery`
3. `add_blog_translation_fields`
4. `add_recipe_translations_video`
5. `add_image_framing`
6. `recipe_position_featured`

### API (`backend/src/routes.js`, all under `/api`)
| Endpoint | Access | Notes |
|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | public | Sets or clears an httpOnly `secerless_token` cookie |
| `GET /auth/me` | public | Returns the current user, or 401 |
| `PUT /auth/me` | user | Updates first name, last name, avatar |
| `GET /recipes`, `GET /recipes/:slug` | public | List shows published only, sorted by `position` |
| `POST /recipes`, `PUT /recipes/:id`, `DELETE /recipes/:id` | admin | New recipes go to the top. Ingredients, steps and gallery are replaced as a whole |
| `GET /blog`, `GET /blog/:slug` | public | List shows published only, newest first |
| `POST /blog`, `PUT /blog/:id`, `DELETE /blog/:id` | admin | EN and SR fields |
| `GET /categories` | public | |
| `POST /contact` | public | Saves the message and emails it to `CONTACT_TO` |
| `GET /favorites`, `POST /favorites`, `DELETE /favorites` | user | |
| `GET /admin/recipes`, `GET /admin/posts` | admin | Includes drafts |
| `POST /admin/recipes/bulk` | admin | publish, unpublish, delete, feature, unfeature |
| `POST /admin/posts/bulk` | admin | publish, unpublish, delete |
| `PUT /admin/recipes/order` | admin | Saves the manual order in a single SQL update |
| `POST /upload` | admin | Image upload to Cloudinary (`image/*`, max 25 MB) |
| `GET /health` | public | Health check |

### Cross-cutting
1. **Auth** (`middleware/auth.js`, `utils/token.js`):
   - The JWT holds the user id and role.
   - `authenticate` runs on every request and never blocks.
   - `requireAuth` returns 401; `requireAdmin` returns 401 or 403.
2. **Cache** (`lib/cache.js`):
   - In memory, 60 s TTL, for recipes, posts and categories (30 s for user lookups).
   - Stale values are served while a fresh copy loads, and simultaneous requests share one query.
   - Any successful content write clears it.
3. **Errors** (`server.js`): one central handler. Duplicate gives 409, not found gives 404, a file that's too large gives 413, any other error under 500 keeps its status, everything else gives 500.
4. **Mail** (`lib/mailer.js`): Nodemailer over SMTP, with replies going to the visitor. If sending fails, the request still succeeds because the message is already saved.
5. **Structure:** one `routes.js` file, one controller per area, shared Prisma client in `lib/prisma.js`.

---

## What's built: frontend

### Pages
Every page exists in English (`/…`) and Serbian (`/sr/…`).

1. `/`: home page.
   - Hero.
   - **Top Recipes** slider: featured recipes, or the first 5 if none are featured.
   - Latest recipes, category tiles with counts, latest blog posts, Instagram call to action.
2. `/recipes`: recipe grid with category filter and favorite buttons.
3. `/recipes/[slug]`: recipe detail.
   - Image slider (cover plus gallery; arrows, keyboard and swipe).
   - Ingredients that can be ticked off, with section headings, and numbered steps.
   - Video player and a favorite button.
4. `/blog`: featured latest post plus a list.
5. `/blog/[slug]`: post rendered from Markdown with a lead paragraph.
6. `/about`, `/contact`. The contact form posts to the API and shows a toast.
7. `/login`, `/register`, `/profile`, `/favorites`.
8. `/admin`: admin dashboard.

### Admin dashboard
1. Admin-only, with a lock screen for everyone else. Recipes and Blog tabs.
2. **Table** (`AdminTable.tsx`):
   - Search, status tabs (All / Published / Drafts / Homepage), category filter.
   - Sorting: custom order, newest, oldest, A–Z.
   - Multi-select with a bulk bar: publish, move to drafts, show on or remove from homepage, move to top, delete.
   - Drag-and-drop or ▲/▼ reordering, with Save order / Undo.
3. **Recipe form**:
   - EN and SR fields side by side, slug auto-filled from the title.
   - Cover upload with vertical framing (`PhotoPosition`).
   - Video URL with preview, category.
   - EN | SR ingredient and step lists, gallery with captions.
   - Published and featured toggles, plus an "Imported from Instagram" badge.
4. **Blog form**: EN and SR title and Markdown content, cover upload, published toggle, live Markdown preview.
5. Image upload by click or drag-and-drop; confirm dialogs before deleting; toast notifications.

### Shared
1. **i18n** (`src/i18n`):
   - `ui.ts` string tables, plus `getLangFromUrl`, `useTranslations` and `useTranslatedPath`.
   - Serbian content falls back to English when a translation is empty, and category names are translated.
   - The NavBar language switch keeps the current page.
2. **Theme** (`styles/global.css`):
   - Custom daisyUI themes `secerless` (light, "Berry & Cream") and `secerless-dark` ("Cocoa Night").
   - Theme toggle in the NavBar, saved in localStorage, with the system preference as the default.
   - Fonts: Plus Jakarta Sans and Fraunces. View transitions and scroll reveal animations, both respecting reduced motion.
3. **Libraries** (`src/lib`):
   - `api.ts` (fetch wrapper that never throws, plus EN/SR localisation), `auth.ts`, `admin.ts`, `favorites.ts`.
   - `image.ts` (framing helpers, Cloudinary `f_auto,q_auto` resizing), `slugify.ts` (strips accents such as č/ć/š/ž/đ).
   - `toast.ts` (event-based toasts shown above modals), `confirm.ts` (Promise-based confirm modal).

---

## Recipe import from Instagram

Existing recipes were imported from Instagram data exports using Node.js scripts in `backend/scripts/instagram/`:

1. Instagram captions were converted into structured, bilingual (EN/SR) recipe data files.
2. `import.mjs` validates the data, uploads photos and videos to Cloudinary, and creates the recipes through Prisma. It is safe to re-run and supports a `--dry-run` mode.
3. `check.mjs` reports imported recipes with missing data.
4. `scripts/healthy-desserts.mjs` sorts sugar-free desserts into their own category.

