import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { asc, eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { users } from '../db/schema';
import { adminMiddleware, authMiddleware } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();

app.use('*', authMiddleware);
app.use('*', adminMiddleware);

function parseUserId(rawId: string) {
  const userId = Number(rawId);
  return Number.isFinite(userId) ? userId : null;
}

function generateRandomPassword(length = 8) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => charset[byte % charset.length]).join('');
}

app.get('/users', async (c) => {
  const db = drizzle(c.env.DB);
  const allUsers = await db.select({
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    avatarUrl: users.avatarUrl,
    createdAt: users.createdAt,
    isApproved: users.isApproved,
    isAdmin: users.isAdmin,
    mustChangePassword: users.mustChangePassword,
  }).from(users).orderBy(asc(users.id)).all();

  return c.json({ users: allUsers });
});

app.post('/approve/:userId', async (c) => {
  const userId = parseUserId(c.req.param('userId'));
  if (!userId) return c.json({ error: 'User tidak valid' }, 400);

  const db = drizzle(c.env.DB);
  const result = await db.update(users)
    .set({ isApproved: 1 })
    .where(eq(users.id, userId))
    .returning();

  if (!result.length) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  return c.json({ message: 'User berhasil disetujui' });
});

app.post('/reject/:userId', async (c) => {
  const userId = parseUserId(c.req.param('userId'));
  if (!userId) return c.json({ error: 'User tidak valid' }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
  if (!existing) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  await db.delete(users).where(eq(users.id, userId));
  return c.json({ message: 'User berhasil ditolak dan dihapus' });
});

app.delete('/users/:userId', async (c) => {
  const userId = parseUserId(c.req.param('userId'));
  if (!userId) return c.json({ error: 'User tidak valid' }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
  if (!existing) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  await db.delete(users).where(eq(users.id, userId));
  return c.json({ message: 'User berhasil dihapus' });
});

app.post('/reset-password/:userId', async (c) => {
  const userId = parseUserId(c.req.param('userId'));
  if (!userId) return c.json({ error: 'User tidak valid' }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).get();
  if (!existing) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  const password = generateRandomPassword(8);
  const hashedPassword = await hash(password, 10);

  await db.update(users)
    .set({ password: hashedPassword, mustChangePassword: 1 })
    .where(eq(users.id, userId));

  return c.json({ password });
});

app.post('/toggle-admin/:userId', async (c) => {
  const userId = parseUserId(c.req.param('userId'));
  if (!userId) return c.json({ error: 'User tidak valid' }, 400);

  const db = drizzle(c.env.DB);
  const existing = await db.select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId)).get();
  if (!existing) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  const nextValue = existing.isAdmin ? 0 : 1;
  await db.update(users)
    .set({ isAdmin: nextValue })
    .where(eq(users.id, userId));

  return c.json({ message: nextValue ? 'Hak admin diberikan' : 'Hak admin dicabut', isAdmin: nextValue });
});

export default app;
