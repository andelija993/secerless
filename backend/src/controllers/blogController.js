import prisma from '../lib/prisma.js';

// GET /api/blog — list all published blog posts
export async function getAllPosts(req, res) {
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      include: { author: { select: { firstName: true, lastName: true } } },
      orderBy: { publishedAt: 'desc' },
    });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
}

// GET /api/blog/:slug — single post
export async function getPostBySlug(req, res) {
  try {
    const post = await prisma.blogPost.findUnique({
      where: { slug: req.params.slug },
      include: { author: { select: { firstName: true, lastName: true } } },
    });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
}

// POST /api/blog — create a post (admin only)
export async function createPost(req, res) {
  try {
    const { title, slug, content, coverImageUrl } = req.body;
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        coverImageUrl,
        authorId: req.user.id, // always the logged-in admin
      },
    });
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
}

// PUT /api/blog/:id — update a post (admin only)
export async function updatePost(req, res) {
  try {
    const { title, slug, content, coverImageUrl, published } = req.body;
    const post = await prisma.blogPost.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(coverImageUrl !== undefined && { coverImageUrl }),
        ...(published !== undefined && { published }),
      },
    });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update post' });
  }
}

// DELETE /api/blog/:id — remove a post (admin-only, enforced later in Phase 3)
export async function deletePost(req, res) {
  try {
    await prisma.blogPost.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete post' });
  }
}

