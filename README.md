# Secerless 🍲

A personal recipe blog & food-story platform — built as a guided learning
project. Recipes originally shared on Instagram, now getting a proper home
with full write-ups, an admin CMS, and user favorites.

## Tech Stack

**Backend** — `backend/`
- Node.js + Express (REST API)
- PostgreSQL + Prisma ORM
- JWT auth (role-based: `user` / `admin`)
- Cloudinary (image uploads)

**Frontend** — `frontend/`
- Astro (content-first, fast, SEO-friendly)
- React islands for interactive pieces (login, favorites, admin forms, slider)
- Tailwind CSS + DaisyUI (component styling)

## Project Structure

```
Secerless/
  backend/     Express API (routes, controllers, middleware, Prisma schema)
  frontend/    Astro site (pages, layouts, components, React islands)
```

## Getting Started

### Backend
```bash
cd backend
cp .env.example .env   # fill in real values as we progress through phases
npm install
npm run dev             # http://localhost:4000
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:4321
```

## Roadmap / Phases

1. ✅ Setup & tech decisions
2. Backend API & data models (Prisma schema, CRUD routes)
3. Authentication & authorization (JWT, admin vs user roles)
4. Frontend structure & static pages connected to real API data
5. Admin dashboard (create/edit recipes & posts, image upload)
6. Public recipe/blog detail pages & filtering
7. User accounts & favorites
8. UI polish: homepage slider, animations, responsiveness
9. Deployment
10. Nice-to-haves: search, comments, newsletter, pagination

See project notes/chat history for the full detailed plan per phase.

