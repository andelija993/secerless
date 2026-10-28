// Sanity check for the Instagram import: every recipe should have a cover,
// and every recipe whose source had a video should have a videoUrl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prisma from '../../src/lib/prisma.js';

const media = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'media.json'), 'utf8'));
const rows = await prisma.recipe.findMany({
  where: { instagramId: { not: null } },
  select: { instagramId: true, title: true, titleSr: true, imageUrl: true, videoUrl: true, published: true },
});
let bad = 0;
for (const r of rows) {
  const hadVideo = media[r.instagramId]?.videos.length > 0;
  if (!r.imageUrl || (hadVideo && !r.videoUrl) || !r.titleSr) {
    bad++;
    console.log('⚠', r.instagramId, r.title, { image: !!r.imageUrl, video: !!r.videoUrl, hadVideo });
  }
}
console.log(`${rows.length} Instagram recipes, ${rows.filter((r) => r.videoUrl).length} with video, ` +
  `${rows.filter((r) => r.published).length} published, ${bad} issue(s)`);
await prisma.$disconnect();

