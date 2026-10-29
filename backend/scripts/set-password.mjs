// Set a user's password. Usage (from /backend): node scripts/set-password.mjs <email>
// The password is typed at a prompt so it never lands in shell history.
import readline from 'node:readline/promises';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/set-password.mjs <email>');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = (await rl.question(`New password for ${email} (min 12 characters): `)).trim();
rl.close();
if (password.length < 12) {
  console.error('Password too short — nothing changed.');
  process.exit(1);
}

const { default: prisma } = await import('../src/lib/prisma.js');
try {
  await prisma.user.update({ where: { email }, data: { password: await bcrypt.hash(password, 10) } });
  console.log(`Password updated for ${email}. Existing sessions stay valid until they expire.`);
} catch (err) {
  console.error(err.code === 'P2025' ? `No user with email ${email}` : err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

