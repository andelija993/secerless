import prisma from '../lib/prisma.js';
import { sendMail } from '../lib/mailer.js';

// Contact form messages are stored as comments without a recipe/post, then emailed to the site owner
export async function submitContactMessage(req, res) {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are all required' });
  }
  const saved = await prisma.comment.create({ data: { name, email, message } });

  // The message is already saved, so a mail failure shouldn't fail the request
  try {
    await sendMail({
      subject: `Šećerless — new message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      replyTo: email,
    });
  } catch (err) {
    console.error('Failed to send contact email', err);
  }

  res.status(201).json(saved);
}

