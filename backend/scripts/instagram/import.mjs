// Import recipes from an Instagram data export into the Šećerless database.
//
// Usage (from /backend):
//   node scripts/instagram/import.mjs --dry-run                 # validate data + media, no writes
//   node scripts/instagram/import.mjs                           # upload media + create recipes as DRAFTS
//   node scripts/instagram/import.mjs --publish                 # same, but published
//   node scripts/instagram/import.mjs --force                   # re-import recipes that already exist
//   node scripts/instagram/import.mjs --only=post-2,reel-3      # import selected items
//   node scripts/instagram/import.mjs --export=/path/to/unzipped/export
//
// Re-runnable: recipes are matched by `instagramId`, and Cloudinary assets use a
// fixed public_id per Instagram item, so nothing gets duplicated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

import posts from './recipes-posts.mjs';
import reels1 from './recipes-reels-1.mjs';
import reels2 from './recipes-reels-2.mjs';
// 2nd export (older posts, archived posts and reels from 2021–2023)
import archive1 from './recipes-archive-1.mjs';
import archive2 from './recipes-archive-2.mjs';
import archive3 from './recipes-archive-3.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const DRY = !!args['dry-run'];
const PUBLISH = !!args.publish;
const FORCE = !!args.force;
const ONLY = args.only ? new Set(String(args.only).split(',')) : null;
const EXPORT_DIR = args.export || '/tmp/ig_export';
const ADMIN_EMAIL = args.admin || 'admin@secerless.dev';

const readJson = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, f), 'utf8'));
// media2.json entries carry their own export `dir`
const media = { ...readJson('media.json'), ...readJson('media2.json') };
const recipes = [...posts, ...reels1, ...reels2, ...archive1, ...archive2, ...archive3].filter((r) => !ONLY || ONLY.has(r.ig));

const split = (pairs) => ({ en: pairs.map((p) => p[0]), sr: pairs.map((p) => p[1]) });

function mediaFor(r) {
  const own = media[r.ig];
  if (!own) throw new Error(`No media entry for ${r.ig}`);
  const dirOf = (m) => m?.dir ?? EXPORT_DIR;
  const images = own.images.map((p) => path.join(dirOf(own), p));
  const extraMedia = r.extraVideo ? media[r.extraVideo] : null;
  const videos = [
    ...own.videos.map((p) => path.join(dirOf(own), p)),
    ...(extraMedia?.videos ?? []).map((p) => path.join(dirOf(extraMedia), p)),
  ];
  return { date: own.date, images, video: videos[0] || null };
}

// ---------- validation ----------
let problems = 0;
const slugs = new Set();
for (const r of recipes) {
  if (slugs.has(r.slug)) { console.error(`✗ duplicate slug ${r.slug}`); problems++; }
  slugs.add(r.slug);
  for (const key of ['title', 'desc']) {
    if (!Array.isArray(r[key]) || r[key].length !== 2) { console.error(`✗ ${r.ig}: bad ${key}`); problems++; }
  }
  for (const key of ['ingredients', 'steps']) {
    if (!r[key]?.length || r[key].some((p) => p.length !== 2 || !p[0] || !p[1])) {
      console.error(`✗ ${r.ig}: bad ${key}`); problems++;
    }
  }
  const m = mediaFor(r);
  for (const f of [...m.images, m.video].filter(Boolean)) {
    if (!fs.existsSync(f)) { console.error(`✗ ${r.ig}: missing file ${f}`); problems++; }
  }
  if (!m.images.length && !m.video) { console.error(`✗ ${r.ig}: no media`); problems++; }
  if (m.video && fs.existsSync(m.video)) {
    const mb = fs.statSync(m.video).size / 1e6;
    if (mb > 95) { console.error(`✗ ${r.ig}: video ${mb.toFixed(1)} MB exceeds Cloudinary free limit`); problems++; }
  }
}
console.log(`${recipes.length} recipes, ${problems} problem(s)`);
if (problems) process.exit(1);
if (DRY) {
  for (const r of recipes) {
    const m = mediaFor(r);
    console.log(`  ${r.ig.padEnd(9)} ${m.date}  ${r.cat.padEnd(9)} img:${m.images.length} vid:${m.video ? 1 : 0}  ${r.title[0]}`);
  }
  process.exit(0);
}

// ---------- import ----------
const { default: prisma } = await import('../../src/lib/prisma.js');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function upload(file, publicId, resourceType) {
  const opts = {
    folder: 'secerless/instagram',
    public_id: publicId,
    resource_type: resourceType,
    overwrite: false, // already uploaded → Cloudinary returns the existing asset
  };
  // upload_large (chunked, needed for videos) is callback-only — wrap it in a Promise
  const res = resourceType === 'video'
    ? await new Promise((resolve, reject) =>
        cloudinary.uploader.upload_large(file, { ...opts, chunk_size: 6_000_000 }, (err, r) => (err ? reject(err) : resolve(r)))
      )
    : await cloudinary.uploader.upload(file, opts);
  if (!res?.secure_url) throw new Error(`Cloudinary returned no URL for ${path.basename(file)}`);
  return res.secure_url;
}

// Square JPG poster frame (2s in) generated by Cloudinary from the video URL
const videoPoster = (url) =>
  url.replace('/video/upload/', '/video/upload/so_2,c_fill,g_auto,w_1080,h_1080/').replace(/\.\w+$/, '.jpg');

const admin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
if (!admin) throw new Error(`Admin user ${ADMIN_EMAIL} not found — run npm run db:seed first`);
const categories = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

let created = 0, updated = 0, skipped = 0, failed = 0;
for (const r of recipes) {
  const label = `${r.ig} ${r.title[0]}`;
  try {
    const existing = await prisma.recipe.findUnique({ where: { instagramId: r.ig } });
    if (existing && !FORCE) { console.log(`↷ skip (exists) ${label}`); skipped++; continue; }

    const m = mediaFor(r);
    const imageUrls = [];
    for (const [i, f] of m.images.entries()) imageUrls.push(await upload(f, `${r.ig}-${i + 1}`, 'image'));
    const videoUrl = m.video ? await upload(m.video, `${r.ig}-video`, 'video') : null;
    const imageUrl = imageUrls[0] || (videoUrl ? videoPoster(videoUrl) : null);

    // Avoid clashing with a manually created recipe that uses the same slug
    let slug = r.slug;
    const clash = await prisma.recipe.findUnique({ where: { slug } });
    if (clash && clash.instagramId !== r.ig) slug = `${slug}-ig`;

    const ing = split(r.ingredients);
    const st = split(r.steps);
    const data = {
      title: r.title[0],
      titleSr: r.title[1],
      slug,
      description: r.desc[0],
      descriptionSr: r.desc[1],
      imageUrl,
      videoUrl,
      instagramId: r.ig,
      published: PUBLISH,
      createdAt: new Date(`${m.date}T12:00:00Z`),
      categoryId: categories[r.cat] ?? null,
      authorId: admin.id,
    };
    const children = {
      ingredients: { create: ing.en.map((text, i) => ({ text, textSr: ing.sr[i], order: i })) },
      steps: { create: st.en.map((text, i) => ({ text, textSr: st.sr[i], order: i })) },
      images: { create: imageUrls.slice(1).map((url, i) => ({ url, order: i })) },
    };

    if (existing) {
      await prisma.$transaction([
        prisma.ingredient.deleteMany({ where: { recipeId: existing.id } }),
        prisma.step.deleteMany({ where: { recipeId: existing.id } }),
        prisma.recipeImage.deleteMany({ where: { recipeId: existing.id } }),
        prisma.recipe.update({ where: { id: existing.id }, data: { ...data, published: existing.published || PUBLISH, ...children } }),
      ]);
      console.log(`↻ updated ${label}`); updated++;
    } else {
      await prisma.recipe.create({ data: { ...data, ...children } });
      console.log(`✓ created ${label}`); created++;
    }
  } catch (err) {
    console.error(`✗ failed ${label}:`, err.message || err);
    failed++;
  }
}

console.log(`\nDone — created ${created}, updated ${updated}, skipped ${skipped}, failed ${failed}.`);
console.log(PUBLISH ? 'Recipes are published.' : 'Recipes were saved as DRAFTS — review & publish them in the admin dashboard.');
await prisma.$disconnect();

