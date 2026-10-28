// Create the "Healthy Desserts" category and move sugar-free desserts into it.
// Usage: node scripts/healthy-desserts.mjs [--apply]
import dotenv from 'dotenv';
dotenv.config();
const { default: prisma } = await import('../src/lib/prisma.js');
const APPLY = process.argv.includes('--apply');

// Ingredients that mean "contains (refined) sugar"
const SUGARY = /\b(sugar|šećer|caster|icing|eurokrem|nutella(?!.*homemade)|milk chocolate|white chocolate|biscuits?|margarine|condensed|ferrero|sweetened)\b/i;
const NOT_SUGAR = /sugar[- ]free|no sugar|bez šećera|stevia|homemade nutella/i;

const healthy = await prisma.category.upsert({
  where: { slug: 'healthy-dessert' },
  update: { name: 'Healthy Desserts' },
  create: { name: 'Healthy Desserts', slug: 'healthy-dessert' },
});

const desserts = await prisma.recipe.findMany({
  where: { category: { slug: 'dessert' } },
  include: { ingredients: true },
  orderBy: { title: 'asc' },
});

const move = [];
for (const r of desserts) {
  const hits = r.ingredients
    .map((i) => i.text)
    .filter((t) => !t.startsWith('## ') && SUGARY.test(t) && !NOT_SUGAR.test(t));
  const sugarFree = hits.length === 0;
  console.log(`${sugarFree ? '→ HEALTHY ' : '  regular '} ${r.title}${hits.length ? `   [${hits.slice(0, 2).join(' | ')}]` : ''}`);
  if (sugarFree) move.push(r.id);
}

console.log(`\n${move.length} of ${desserts.length} desserts are sugar-free.`);
if (APPLY) {
  const res = await prisma.recipe.updateMany({ where: { id: { in: move } }, data: { categoryId: healthy.id } });
  console.log(`Moved ${res.count} recipes to "Healthy Desserts".`);
} else {
  console.log('Dry run — add --apply to move them.');
}
await prisma.$disconnect();

