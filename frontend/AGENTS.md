# Šećerless frontend: notes for coding agents

Project-wide architecture, conventions, playbooks and pitfalls are in the root [`AGENTS.md`](../AGENTS.md). **Read it first.** This file adds frontend-specific notes. (`CLAUDE.md` in this folder is a symlink to this file, so edit `AGENTS.md` only.)

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

- The API must be running: `cd ../backend && npm run dev`. Its URL comes from `PUBLIC_API_URL` (default `http://localhost:4000/api`, see `.env.example`).
- Verify changes with `npx astro check`, then `npm run build`. The build fetches published recipes and posts from the API to generate `[slug]` pages, so it fails or produces empty pages without the backend.
- Check every UI change at `/…` **and** `/sr/…`, in light **and** dark theme.

## Stack specifics

- **Astro 7**, static output (no adapter). Pages and `*View.astro` components render at build time; top-level `await` in their frontmatter runs once during the build, not per request.
- **React 19 islands** (`*.tsx`) hydrate with `client:load`. They receive `lang` as a prop and talk to the API through `src/lib/*`.
- **Tailwind CSS 4** via `@tailwindcss/vite` (no `tailwind.config.js`; configuration lives in `src/styles/global.css`) and **daisyUI 5** with only the custom `secerless` / `secerless-dark` themes enabled.
- Fonts are self-hosted through `@fontsource-variable` (Plus Jakarta Sans for body text, Fraunces for headings).
- Markdown (blog posts) is rendered with `marked`.

## Astro documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

