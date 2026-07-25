import prisma from '../lib/prisma.js';

// POST /api/contact — the "Questions & Collaboration" form on the frontend
// posts here. Stored as a Comment with no recipeId/postId attached.
export async function submitContactMessage(req, res) {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are all required' });
    }

    const entry = await prisma.comment.create({
      data: { name, email, message },
    });
    res.status(201).json(entry);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit message' });
  }
}

