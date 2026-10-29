# Šećerless: guide for coding agents

Bilingual (English/Serbian) recipe blog and food-story site. Read this file before making changes; it captures how the project is built, the conventions it follows, and the mistakes that have already been made once.

> **This is a public repository.** Never commit secrets, API keys, passwords, tokens, real email addresses or other personal data, not even in comments, examples, tests or docs. Real values live only in `backend/.env` (git-ignored). Use placeholders such as `you@example.com` everywhere else.

---

## 1. Architecture at a glance

```
Browser
  │  static HTML (built once)            React islands (client:load)
  │  ◄── frontend/dist ◄── astro build    │  login, favorites, profile, admin, contact
  │                          │            │
  │                          ▼            ▼
  │                   GET /api/...  ◄──  fetch with credentials (cookie: secerless_token)
  ▼                          │
backend (Express 5) ── routes.js ── middleware/auth.js ── controllers/* ── lib/cache.js
                                                                │
                                                     Prisma 7 + @prisma/adapter-pg
                                                                │
                                                           PostgreSQL
Cloudinary ◄── /api/upload (admin images)   SMTP ◄── /api/contact (lib/mailer.js)
```

Key facts that shape every change:

1. **The frontend is fully static** (no SSR adapter in `astro.config.mjs`). Public pages fetch the API **at build time**, so new or edited content only appears after `npm run build`. Anything per-user (auth, favorites, profile, admin, contact form) runs in the browser.
2. **Auth is a cookie**, not a header: an httpOnly `secerless_token` JWT (`sameSite: lax`, `secure` in production). CORS allows exactly `FRONTEND_URL` with `credentials: true`; the frontend sends `credentials: 'include'` on every call.
3. **Every page exists in two languages**: `/…` (EN, default) and `/sr/…` (SR).
4. **Content is translated per field**, not per row: `title`/`titleSr`, `description`/`descriptionSr`, `content`/`contentSr`, `text`/`textSr`. Serbian falls back to English when empty.

---

## 2. Repository map

| Path | What lives there |
|---|---|
| `backend/src/server.js` | App setup: JWT secret check, CORS, JSON limit (10 MB), cookies, `authenticate`, cache invalidation, central error handler |
| `backend/src/routes.js` | **The only route file.** Every endpoint, with its auth guard |
| `backend/src/controllers/` | One file per area: `auth`, `recipe`, `blog`, `admin`, `favorite`, `category`, `contact`, `upload` |
| `backend/src/middleware/auth.js` | `authenticate` (never blocks), `requireAuth` (401), `requireAdmin` (401/403) |
| `backend/src/lib/` | `prisma.js` (shared client), `cache.js` (in-memory cache), `mailer.js` (Nodemailer) |
| `backend/src/utils/token.js` | Cookie name, sign/verify JWT |
| `backend/prisma/schema.prisma` | Data model. `prisma.config.ts` holds the datasource URL and seed command (Prisma 7 style) |
| `backend/prisma/migrations/` | Applied migrations. **Never edit existing ones** |
| `backend/prisma/seed.js` | Admin user (from `ADMIN_EMAIL`/`ADMIN_PASSWORD`), categories, sample content. Idempotent upserts |
| `backend/scripts/` | One-off data scripts (Instagram import, healthy-desserts categorisation) |
| `frontend/src/pages/` | Thin route files; `pages/sr/` mirrors every EN page |
| `frontend/src/components/` | `*View.astro` = page bodies shared by EN/SR; `*.tsx` = React islands |
| `frontend/src/layouts/Layout.astro` | HTML shell, theme bootstrapping, scroll reveal, toast host |
| `frontend/src/lib/` | `api.ts`, `auth.ts`, `admin.ts`, `favorites.ts`, `image.ts`, `slugify.ts`, `toast.ts`, `confirm.ts` |
| `frontend/src/i18n/` | `ui.ts` (EN + SR string tables), `utils.ts` (`getLangFromUrl`, `useTranslations`, `useTranslatedPath`) |
| `frontend/src/styles/global.css` | Tailwind 4 + daisyUI 5 setup, custom themes, fonts, utilities, motion |

---

## 3. Commands

| Where | Command | Purpose |
|---|---|---|
| `backend/` | `npm run dev` | API on http://localhost:4000 (nodemon) |
| `backend/` | `npm run db:migrate` | Create and apply a migration after editing `schema.prisma` |
| `backend/` | `npm run db:generate` | Regenerate the Prisma client |
| `backend/` | `npm run db:seed` | Seed admin, categories, sample content (safe to re-run) |
| `backend/` | `npm run db:studio` | Browse the database |
| `frontend/` | `astro dev --background` | Dev server on http://localhost:4321 (`astro dev stop / status / logs`) |
| `frontend/` | `npx astro check` | Type-check `.astro`, `.ts`, `.tsx` |
| `frontend/` | `npm run build` | Static build into `dist/` (needs the API running) |

The backend **refuses to start** unless `JWT_SECRET` is at least 32 characters and not the `.env.example` placeholder (`openssl rand -hex 32`). There is no automated test suite.

**Shell notes (zsh on macOS):** avoid `!` inside double-quoted inline scripts (history expansion breaks them); write a temporary script file instead. Never print secrets: check `.env` values by length or presence, not by echoing them.

---

## 4. Backend conventions

- **Routes:** add every endpoint to `routes.js` with the right guard: public, `requireAuth`, or `requireAdmin`. Admin-only lists live under `/api/admin/...`.
- **Controllers** are `async` functions with no try/catch. Express 5 forwards thrown errors to the handler in `server.js`:
  | Error | Response |
  |---|---|
  | Prisma `P2002` (unique violation, e.g. slug taken) | 409 |
  | Prisma `P2025` (record not found) | 404 |
  | Multer `LIMIT_FILE_SIZE` | 413 |
  | Error with `status < 500` | That status and its message |
  | Anything else | 500, logged |

  Validate input early and `return res.status(400).json({ error: '...' })`. Only catch errors for best-effort side effects that must not fail the request (the contact email is the example).
- **Errors are user-facing strings** in `{ error }`; keep them short and readable.
- **Whitelist writable fields.** `recipeData()` in `recipeController.js` and `postData()` in `blogController.js` copy only known keys from the body. New columns are **silently ignored** until added there. Never spread `req.body` into Prisma.
- **Child collections are replaced, not merged.** On `PUT /recipes/:id`, sending `ingredients`, `steps` or `images` deletes and recreates that whole list. Omit the key to leave it untouched; always send the complete list when changing it.
- **Caching:** public reads go through `cached(key, loader)`. `server.js` clears the whole cache after any successful non-GET to `/api/(recipes|blog|categories|admin|auth)`. A new write route under a different prefix must be added to that regex, or readers will see stale data for up to 60 s (and longer, because stale values are served while refreshing).
- **Batch database writes.** The database is remote; many sequential queries inside one transaction exceeded Prisma's timeout before. Prefer `updateMany`/`deleteMany`/nested writes, or a single `$executeRaw` (see `reorderRecipes`). Always use tagged-template `$executeRaw`/`$queryRaw` so values are parameterised; never build SQL strings.
- **Schema changes:** edit `schema.prisma`, run `npm run db:migrate -- --name <what_changed>`, commit the generated migration. Give new columns defaults so existing rows stay valid. Back-fill in the migration SQL when needed (see `recipe_position_featured`).
- **Translations:** a translatable field gets an `…Sr` sibling, nullable. Store empty Serbian text as `null` (`value || null`).
- **Ordering and visibility:** recipes sort by `position` ascending (new recipes get `min - 1`, so positions can be negative), then `createdAt` descending. `featured` drives the homepage slider; `published: false` means draft.
- **Passwords:** bcrypt with cost 10. Never return the `password` field; select or strip it.

---

## 5. Frontend conventions

- **Pages are thin.** An EN page and its SR twin only pick the layout, the title and `lang`, then render a shared component:
  ```astro
  <Layout title="Recipes — Šećerless"><RecipesIndexView lang="en" /></Layout>
  ```
  Logic, markup and data fetching belong in the component. Pages under `pages/sr/` use one extra `../` in imports.
- **Dynamic routes** (`[slug].astro`) use `getStaticPaths()` with `getRecipes()`/`getPosts()`, so only **published** items get pages. SR detail pages call `getRecipeBySlug(slug, 'sr')` and redirect to the SR index when not found.
- **i18n:**
  - Every visible string is a key in **both** `en` and `sr` in `i18n/ui.ts`. Missing SR keys fall back to EN silently, so check both tables.
  - Read strings with `useTranslations(lang)`; build links with `useTranslatedPath(lang)`. Never hard-code `/sr/` paths.
  - React islands get `lang` as a prop. Text needed by an inline `<script>` is passed via `data-*` attributes (see `contact.astro`).
  - Recipe localisation (including Serbian category names) happens in `localizeRecipe()` in `lib/api.ts`; blog views fall back `titleSr → title` themselves.
- **API access:** only through `request()` in `lib/api.ts` or the wrappers in `auth.ts`, `admin.ts`, `favorites.ts`. `request()` never throws; it returns `{ ok, status, data }`. Always branch on `ok` and show `data.error` when present.
- **Feedback:** `showToast(message, 'success' | 'error' | 'info')` for results, `await confirmDialog(...)` before destructive actions. No `alert()`/`confirm()`.
- **Islands:** use `client:load` only where interaction or per-user data is required; everything else stays static Astro.
- **Styling:** Tailwind utilities plus daisyUI components, using theme tokens (`primary`, `secondary`, `base-100/200/300`, `base-content`). No hard-coded hex colours: they break the dark theme (`secerless-dark`). Respect `prefers-reduced-motion` for new animations, as `global.css` does.
- **Images:** run Cloudinary URLs through `optimizeImage(url, width)`; use `coverPos`/`galleryPos` for vertical framing (`imagePosY`, 0–100). `imagePosX` and `imageZoom` exist in the schema but are unused; don't build on them without wiring them through the API and UI.
- **Slugs:** generate with `lib/slugify.ts` (handles č, ć, š, ž, đ). Slugs are unique; a duplicate returns 409.
- **Accessibility:** buttons are `<button type="button">` unless they submit; images need meaningful `alt`; icon-only controls need `aria-label` or `title`.

---

## 6. Playbooks

### Add a field to recipes
1. `schema.prisma`: add the column with a default (or nullable), plus an `…Sr` sibling if it is text shown to readers.
2. `npm run db:migrate -- --name add_recipe_<field>`.
3. `recipeController.js`: add the key to `recipeData()`, otherwise it is never saved.
4. `frontend/src/lib/api.ts`: extend `RecipeSummary`/`RecipeDetail`; add it to `localizeRecipe()` if translatable.
5. `RecipeForm.tsx`: an input (EN and SR side by side when translatable).
6. Views that display it, plus labels in both i18n tables.
7. Rebuild the frontend to see it on public pages.

### Add an API endpoint
1. Controller function in the matching `controllers/*.js` file.
2. Route in `routes.js` with the correct guard.
3. If it writes data, make sure its path is covered by the cache-clearing regex in `server.js`.
4. Client wrapper in `frontend/src/lib/*.ts` using `request()`.

### Add a page
1. `components/<Name>View.astro` taking `lang`.
2. `pages/<route>.astro` and `pages/sr/<route>.astro`, both thin.
3. Strings in both i18n tables; nav and footer links via `useTranslatedPath`.

### Add an environment variable
1. Read it in code with a safe default or a clear startup error.
2. Add it to `backend/.env.example` with a placeholder, and to the variables table in `README.md`.
3. Never give it a real personal value as a code default.

---

## 7. Known pitfalls

- **Content doesn't appear?** The site is static: rebuild the frontend. The backend cache also lives up to 60 s if a write bypassed the invalidation regex.
- **Drafts are reachable by slug** through the public `GET /recipes/:slug` and `GET /blog/:slug` (they don't filter on `published`). The static build never links to them, but the API does serve them. Fix before relying on drafts being private.
- **A saved field "doesn't stick"**: it is missing from the controller whitelist (`recipeData()` / `postData()`).
- **Lost ingredients/steps/gallery after an edit**: a partial list was sent; child lists are replaced as a whole.
- **Login works on localhost but not in production**: `FRONTEND_URL` must exactly match the site origin (CORS with credentials), and HTTPS is required for the `secure` cookie.
- **Production API calls go through the Netlify proxy.** The browser uses the relative `PUBLIC_API_URL=/api` (`frontend/netlify.toml` forwards it to Render), which keeps the login cookie first-party. The build uses the absolute `API_URL`. Never point browser code at the Render URL directly: cross-site cookies are blocked.
- **A deploy fails with "Build could not load …"**: this is deliberate (`assertBuildFetch` in `lib/api.ts`) so an unreachable API never publishes an empty site. Render's free service may have been asleep; retry.
- **Admin edits go live via a rebuild.** `lib/rebuild.js` calls `NETLIFY_BUILD_HOOK` 60 s after the last content write. New content routes must match `SITE_CONTENT` in `server.js` to trigger it.
- **Upload rejected**: `/api/upload` accepts `image/*` only, max 25 MB. Videos are referenced by URL (`videoUrl`).
- **Contact emails not arriving**: `CONTACT_TO`, `SMTP_USER` and `SMTP_PASS` must all be set; otherwise messages are only stored as `Comment` rows (view them with `db:studio`).
- **Several edits to the same file at once can overwrite each other.** Make edits to one file sequentially and re-read it to confirm they landed.
- **`frontend/CLAUDE.md` is a symlink to `frontend/AGENTS.md`.** Writing to `CLAUDE.md` overwrites `AGENTS.md`; always edit `AGENTS.md`.

---

## 8. Code style

- Match the surrounding code: ES modules, 2-space indent, single quotes, small focused functions, early returns.
- Keep changes minimal and local. Prefer extending an existing file over adding a new abstraction; don't add dependencies when a few lines will do.
- Comments explain **why** (a constraint, a workaround, a non-obvious decision), never what the next line does. No decorative divider comments, roadmap/"Phase N"/TODO notes, or commented-out code.
- Remove what you make obsolete: unused functions, imports, i18n keys, env vars, files.
- Keep `README.md` in sync when features, commands or env vars change. It lists features, not development history.

---

## 9. Security checklist

- [ ] No secrets, personal emails, phone numbers or real passwords in tracked files (`git ls-files | xargs grep -nE '…'` before committing).
- [ ] New config read from `process.env` and documented in `.env.example` with placeholders.
- [ ] Admin-only actions guarded by `requireAdmin` on the server, not just hidden in the UI.
- [ ] User input validated server-side; only whitelisted fields written to the database.
- [ ] Raw SQL only via tagged templates.
- [ ] User-provided text rendered as text: Astro and React escape by default; in vanilla scripts use `textContent`, and never interpolate user input into `innerHTML`. `set:html` is used only for admin-authored blog Markdown (`BlogPostView.astro`).
- [ ] Images published in `public/` have EXIF/GPS metadata stripped.

---

## 10. Definition of done

1. The change works in **both** languages and in **both** themes (light and dark).
2. `npx astro check` passes for frontend changes; `node --check` passes for changed backend files; the affected endpoints were exercised.
3. Schema changes come with a committed migration; new env vars are in `.env.example` and the README.
4. No leftover debug output, unused code or stale comments.
5. The security checklist above holds.

