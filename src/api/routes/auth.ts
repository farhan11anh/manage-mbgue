import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { setCookie, deleteCookie } from 'hono/cookie';
import { users } from '../db/schema';
import { authMiddleware, createToken, AuthUser } from '../middleware/auth';

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string } }>();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { username, password, displayName } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    return c.json({ error: 'Username sudah digunakan' }, 400);
  }

  const hashedPassword = await hash(password, 10);
  const result = await db.insert(users).values({
    username,
    password: hashedPassword,
    displayName,
  }).returning();

  const user = result[0];
  const token = await createToken(
    { id: user.id, username: user.username, displayName: user.displayName },
    c.env.JWT_SECRET || 'dev-secret-key'
  );

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return c.json({ user: { id: user.id, username: user.username, displayName: user.displayName } });
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { username, password } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const user = await db.select().from(users).where(eq(users.username, username)).get();
  if (!user) {
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  const valid = await compare(password, user.password);
  if (!valid) {
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  const token = await createToken(
    { id: user.id, username: user.username, displayName: user.displayName },
    c.env.JWT_SECRET || 'dev-secret-key'
  );

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return c.json({ user: { id: user.id, username: user.username, displayName: user.displayName } });
});

app.post('/logout', (c) => {
  deleteCookie(c, 'token', { path: '/' });
  return c.json({ message: 'Logged out' });
});

app.get('/me', authMiddleware, (c) => {
  const user = c.get('user') as AuthUser;
  return c.json({ user });
});

app.patch('/profile', authMiddleware, zValidator('json', z.object({ displayName: z.string().min(1).max(100) })), async (c) => {
  const user = c.get('user') as AuthUser;
  const { displayName } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  await db.update(users).set({ displayName }).where(eq(users.id, user.id));

  return c.json({ user: { ...user, displayName } });
});

export default app;
