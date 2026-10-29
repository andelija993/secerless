import prisma from '../lib/prisma.js';
import { cached } from '../lib/cache.js';

const author = { select: { firstName: true, lastName: true } };

// Only fields that were sent; empty Serbian text is stored as null
function postData(body) {
  const data = {};
  for (const key of ['title', 'slug', 'content', 'coverImageUrl', 'published']) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  for (const key of ['titleSr', 'contentSr']) {
    if (body[key] !== undefined) data[key] = body[key] || null;
  }
  return data;
}

export async function getAllPosts(req, res) {
  const posts = await cached('blog:all', () =>
    prisma.blogPost.findMany({ where: { published: true }, include: { author }, orderBy: { publishedAt: 'desc' } })
  );
  res.json(posts);
}

export async function getPostBySlug(req, res) {
  const { slug } = req.params;
  const post = await cached(`blog:slug:${slug}`, () =>
    prisma.blogPost.findUnique({ where: { slug }, include: { author } })
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json(post);
}

export async function createPost(req, res) {
  const post = await prisma.blogPost.create({ data: { ...postData(req.body), authorId: req.user.id } });
  res.status(201).json(post);
}

export async function updatePost(req, res) {
  const post = await prisma.blogPost.update({ where: { id: req.params.id }, data: postData(req.body) });
  res.json(post);
}

export async function deletePost(req, res) {
  await prisma.blogPost.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

