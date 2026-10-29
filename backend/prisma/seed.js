import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

const { PrismaClient } = pkg;

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Credentials come from .env; without a password a random one is generated so no default login exists
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@secerless.dev';
const generatedPassword = process.env.ADMIN_PASSWORD ? null : crypto.randomBytes(12).toString('base64url');

async function main() {
  // Only applied when the admin is first created; an existing admin keeps their password
  const adminExisted = !!(await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } }));
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || generatedPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  // Categories (canonical set)
  await prisma.category.upsert({
    where: { slug: 'breakfast' },
    update: { name: 'Breakfast' },
    create: { name: 'Breakfast', slug: 'breakfast' },
  });
  await prisma.category.upsert({
    where: { slug: 'lunch' },
    update: { name: 'Lunch' },
    create: { name: 'Lunch', slug: 'lunch' },
  });
  const dinner = await prisma.category.upsert({
    where: { slug: 'dinner' },
    update: { name: 'Dinner' },
    create: { name: 'Dinner', slug: 'dinner' },
  });
  await prisma.category.upsert({
    where: { slug: 'drink' },
    update: { name: 'Drink' },
    create: { name: 'Drink', slug: 'drink' },
  });
  const dessert = await prisma.category.upsert({
    where: { slug: 'dessert' },
    update: { name: 'Dessert' },
    create: { name: 'Dessert', slug: 'dessert' },
  });
  await prisma.category.upsert({
    where: { slug: 'healthy-dessert' },
    update: { name: 'Healthy Desserts' },
    create: { name: 'Healthy Desserts', slug: 'healthy-dessert' },
  });
  await prisma.category.upsert({
    where: { slug: 'ice-cream' },
    update: { name: 'Ice Cream' },
    create: { name: 'Ice Cream', slug: 'ice-cream' },
  });

  // Sample recipes
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

  // Sample blog posts
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

  await prisma.blogPost.upsert({
    where: { slug: 'sourdough-bread-benefits' },
    update: {},
    create: {
      title: 'Why Sourdough Bread Is More Than Just a Trend',
      slug: 'sourdough-bread-benefits',
      coverImageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      content: `# Why Sourdough Bread Is More Than Just a Trend

Sourdough has become incredibly popular, and for a good reason. It is not just about a beautiful crust or the satisfying tangy flavor. The real magic is in the fermentation process.

## What makes sourdough different?

Traditional sourdough uses a natural starter made from flour and water. That starter captures wild yeasts and beneficial bacteria, which slowly ferment the dough. This process changes the bread in a few important ways:

- it improves digestibility
- it can support a gentler blood sugar response
- it creates a more complex flavor profile
- it gives the loaf a more satisfying texture

## The benefits people talk about

Because sourdough ferments over a longer period, the grains are broken down more thoroughly. This can make the bread easier on the stomach for some people compared with highly refined bread.

It also tends to be less sweet than many commercial loaves, and many home bakers love that it feels more nourishing and satisfying. It is not a health cure-all, but it is a great example of how time and simple ingredients can transform a staple food.

## A simple way to enjoy it

You do not need to become a full-time baker to enjoy sourdough. A slice with butter, good olive oil, a little sea salt, or a bowl of soup can feel nourishing and comforting without being overly heavy.

The best part is that sourdough brings both flavor and ritual into the kitchen. There is something calming about feeding a starter, mixing a dough, and waiting for it to rise.

## A small note

Not every loaf is created equal. Some sourdoughs are made with whole grains and simple ingredients, while others are more refined. If you enjoy bread, sourdough is a lovely option to explore — especially when it is made with quality ingredients and patience.`,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: 'sugar-and-its-impact' },
    update: {},
    create: {
      title: 'Sugar and Its Impact on Health',
      slug: 'sugar-and-its-impact',
      coverImageUrl: 'https://images.unsplash.com/photo-1511690656952-34342bb7c2f2?w=1200',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      content: `# Sugar and Its Impact on Health

Sugar is one of the most debated ingredients in modern nutrition. It is not “bad” in the sense that it has no place in food, but it is easy to consume far more than our bodies truly need.

## Why too much sugar can be a problem

When we eat large amounts of added sugar, especially in liquid or ultra-processed forms, it can cause quick spikes in blood sugar. Over time, that pattern may contribute to energy dips, cravings, and changes in how the body stores fat.

It is also worth noting that sugar is often hidden in foods we do not expect: sauces, dressings, granola, breakfast cereals, flavored yogurts, and even savory snacks.

## The difference between natural and added sugar

Fruit contains natural sugars alongside fiber, water, and micronutrients. That makes it a very different story from a soda, candy bar, or pastry where the sugar is isolated and concentrated.

The goal is not to fear all carbohydrates. It is to be more intentional about where the sugar is coming from and how frequently it appears in the diet.

## Better habits without feeling restricted

A balanced approach usually works best:

- choose whole foods more often
- read labels when buying packaged items
- enjoy desserts intentionally instead of mindlessly
- focus on meals with protein, fiber, and healthy fats to keep energy stable

## A realistic perspective

You do not need to eliminate sugar completely to eat in a healthier way. Small changes, repeated consistently, are what matter most. A kitchen built around real ingredients and home cooking often naturally reduces the amount of added sugar in our daily eating.

This is one of the reasons I love home cooking so much: it gives us control over the ingredients, the balance, and the rhythm of eating.`,
    },
  });

  await prisma.blogPost.upsert({
    where: { slug: 'kitchen-tips-and-tricks' },
    update: {},
    create: {
      title: 'Kitchen Tips and Tricks That Make Everyday Cooking Easier',
      slug: 'kitchen-tips-and-tricks',
      coverImageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id,
      content: `# Kitchen Tips and Tricks That Make Everyday Cooking Easier

Cooking is not just about recipes. It is also about flow, rhythm, and a few small habits that make the whole process smoother.

## 1. Start with your mise en place

Before you begin cooking, gather all ingredients and tools. This one habit reduces stress enormously. When your kitchen is organized, you cook more calmly and with fewer mistakes.

## 2. Taste while you cook, not only at the end

A lot of recipes feel more forgiving when you check seasoning along the way. Salt and acid are especially important to adjust gradually rather than all at once.

## 3. Use your senses, not just the timer

Color, texture, aroma, and sound are all clues. A pan may be ready before the timer says so, especially when you are sautéing vegetables or checking baked goods.

## 4. Make the most of leftovers

Roasted vegetables, grains, and proteins are perfect for lunches or quick dinners. A little planning can turn leftovers into a completely new meal with almost no effort.

## 5. Keep a “flavor base” ready

Onions, garlic, herbs, citrus, and a good stock or broth can turn a simple dish into something deeply satisfying. Having these basic ingredients on hand makes cooking feel much easier.

## 6. Trust the pan, not perfection

Not every dish will look exactly like a recipe photo. That is normal. The goal is flavor, comfort, and learning what works in your own kitchen.

## 7. Clean as you go

This is one of the best habits for anyone who cooks regularly. A few minutes of tidying while food is simmering helps the whole kitchen feel lighter and makes the final cleanup far less overwhelming.

If you cook with intention and patience, even the simplest meals can become something memorable.`,
    },
  });

  console.log('✅ Seed complete.');
  if (adminExisted) console.log(`Admin ${ADMIN_EMAIL} already existed — password unchanged.`);
  else if (generatedPassword) console.log(`Admin created: ${ADMIN_EMAIL} / ${generatedPassword} (shown once — save it)`);
  else console.log(`Admin created: ${ADMIN_EMAIL} (password from ADMIN_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

