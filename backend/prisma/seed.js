import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const { PrismaClient } = pkg;

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Admin user (for testing Phase 3 auth + Phase 5 admin dashboard) ---
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@secerless.dev' },
    update: {},
    create: {
      email: 'admin@secerless.dev',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  // --- Categories ---
  const dinner = await prisma.category.upsert({
    where: { slug: 'dinner' },
    update: {},
    create: { name: 'Dinner', slug: 'dinner' },
  });
  const dessert = await prisma.category.upsert({
    where: { slug: 'dessert' },
    update: {},
    create: { name: 'Dessert', slug: 'dessert' },
  });

  // --- Recipes (matching the placeholders already in the frontend) ---
  await prisma.recipe.upsert({
    where: { slug: 'garlic-butter-pasta' },
    update: {},
    create: {
      title: 'Garlic Butter Pasta',
      slug: 'garlic-butter-pasta',
      description: 'Creamy, garlicky weeknight comfort food.',
      imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=1200',
      categoryId: dinner.id,
      authorId: admin.id,
      ingredients: {
        create: [
          { text: '400g spaghetti', order: 0 },
          { text: '6 cloves garlic, minced', order: 1 },
          { text: '60g butter', order: 2 },
          { text: 'Parmesan, parsley, chili flakes', order: 3 },
        ],
      },
      steps: {
        create: [
          { text: 'Boil pasta until al dente.', order: 0 },
          { text: 'Melt butter, sauté garlic until fragrant.', order: 1 },
          { text: 'Toss pasta in the garlic butter with a splash of pasta water.', order: 2 },
          { text: 'Top with parmesan, parsley, and chili flakes.', order: 3 },
        ],
      },
    },
  });

  await prisma.recipe.upsert({
    where: { slug: 'grandmas-apple-pie' },
    update: {},
    create: {
      title: "Grandma's Apple Pie",
      slug: 'grandmas-apple-pie',
      description: 'A family classic, baked to golden perfection.',
      imageUrl: 'https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?w=1200',
      categoryId: dessert.id,
      authorId: admin.id,
      ingredients: { create: [{ text: 'Apples, flour, butter, cinnamon, sugar', order: 0 }] },
      steps: { create: [{ text: 'Full recipe coming soon!', order: 0 }] },
    },
  });

  await prisma.recipe.upsert({
    where: { slug: 'spicy-thai-curry' },
    update: {},
    create: {
      title: 'Spicy Thai Curry',
      slug: 'spicy-thai-curry',
      description: 'Bold, fragrant, and ready in 30 minutes.',
      imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=1200',
      categoryId: dinner.id,
      authorId: admin.id,
      ingredients: { create: [{ text: 'Coconut milk, curry paste, vegetables, protein of choice', order: 0 }] },
      steps: { create: [{ text: 'Full recipe coming soon!', order: 0 }] },
    },
  });

  // --- Blog post ---
  await prisma.blogPost.upsert({
    where: { slug: 'why-i-started-cooking' },
    update: {},
    create: {
      title: 'Why I Started Cooking',
      slug: 'why-i-started-cooking',
      content: 'The story behind this whole project — coming soon!',
      authorId: admin.id,
    },
  });

  console.log('✅ Seed complete. Admin login: admin@secerless.dev / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

