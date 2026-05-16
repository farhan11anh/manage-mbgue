import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { hash, compare } from 'bcryptjs';
import { deleteCookie } from 'hono/cookie';
import { users } from '../db/schema';
import { authMiddleware, setAuthCookie, AuthUser } from '../middleware/auth';

const app = new Hono<{ Bindings: { DB: D1Database; JWT_SECRET: string; CLOUDINARY_API_SECRET: string } }>();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().optional(),
  newPassword: z.string().min(6),
});

function toAuthUser(user: typeof users.$inferSelect): AuthUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    mustChangePassword: user.mustChangePassword,
  };
}

app.post('/register', zValidator('json', registerSchema), async (c) => {
  const { password, displayName } = c.req.valid('json');
  const username = c.req.valid('json').username.toLowerCase();
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing) {
    return c.json({ error: 'Username sudah digunakan' }, 400);
  }

  const hashedPassword = await hash(password, 10);
  await db.insert(users).values({
    username,
    password: hashedPassword,
    displayName,
    isApproved: 0,
  });

  return c.json({ message: 'Akun berhasil dibuat, menunggu persetujuan admin' }, 201);
});

app.post('/login', zValidator('json', loginSchema), async (c) => {
  const { password } = c.req.valid('json');
  const username = c.req.valid('json').username.toLowerCase();
  const db = drizzle(c.env.DB);

  const user = await db.select().from(users).where(eq(users.username, username)).get();
  if (!user) {
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  const valid = await compare(password, user.password);
  if (!valid) {
    return c.json({ error: 'Username atau password salah' }, 401);
  }

  if (user.isApproved !== 1) {
    return c.json({ error: 'Akun belum disetujui admin' }, 403);
  }

  const authUser = toAuthUser(user);
  await setAuthCookie(c, authUser);

  return c.json({ user: authUser });
});

app.post('/logout', (c) => {
  deleteCookie(c, 'token', { path: '/' });
  return c.json({ message: 'Logged out' });
});

app.get('/me', authMiddleware, (c) => {
  const user = (c as any).get('user') as AuthUser;
  return c.json({ user });
});

app.patch('/profile', authMiddleware, zValidator('json', z.object({ displayName: z.string().min(1).max(100) })), async (c) => {
  const user = (c as any).get('user') as AuthUser;
  const { displayName } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.update(users)
    .set({ displayName })
    .where(eq(users.id, user.id))
    .returning();

  const updatedUser = toAuthUser(result[0]);
  await setAuthCookie(c, updatedUser);

  return c.json({ user: updatedUser });
});

app.post('/change-password', authMiddleware, zValidator('json', changePasswordSchema), async (c) => {
  const user = (c as any).get('user') as AuthUser;
  const { oldPassword, newPassword } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(users).where(eq(users.id, user.id)).get();
  if (!existing) {
    return c.json({ error: 'User tidak ditemukan' }, 404);
  }

  if (!user.mustChangePassword) {
    if (!oldPassword) {
      return c.json({ error: 'Password lama wajib diisi' }, 400);
    }

    const valid = await compare(oldPassword, existing.password);
    if (!valid) {
      return c.json({ error: 'Password lama tidak sesuai' }, 400);
    }
  }

  const hashedPassword = await hash(newPassword, 10);
  const result = await db.update(users)
    .set({ password: hashedPassword, mustChangePassword: 0 })
    .where(eq(users.id, user.id))
    .returning();

  const updatedUser = toAuthUser(result[0]);
  await setAuthCookie(c, updatedUser);

  return c.json({ message: 'Password berhasil diubah', user: updatedUser });
});

// Cloudinary signed upload signature
app.post('/cloudinary-signature', authMiddleware, async (c) => {
  const { params_to_sign } = await c.req.json();
  const apiSecret = c.env.CLOUDINARY_API_SECRET;

  if (!apiSecret) {
    return c.json({ error: 'Cloudinary not configured' }, 500);
  }

  const sortedKeys = Object.keys(params_to_sign).sort();
  const paramString = sortedKeys.map((k: string) => `${k}=${params_to_sign[k]}`).join('&');
  const toSign = paramString + apiSecret;

  const encoder = new TextEncoder();
  const data = encoder.encode(toSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return c.json({ signature });
});

// Save avatar URL after Cloudinary upload
app.patch('/avatar', authMiddleware, zValidator('json', z.object({ avatarUrl: z.string().url() })), async (c) => {
  const user = (c as any).get('user') as AuthUser;
  const { avatarUrl } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.update(users)
    .set({ avatarUrl })
    .where(eq(users.id, user.id))
    .returning();

  const updatedUser = toAuthUser(result[0]);
  await setAuthCookie(c, updatedUser);

  return c.json({ user: updatedUser });
});

// Delete avatar
app.delete('/avatar', authMiddleware, async (c) => {
  const user = (c as any).get('user') as AuthUser;
  const db = drizzle(c.env.DB);

  const result = await db.update(users)
    .set({ avatarUrl: null })
    .where(eq(users.id, user.id))
    .returning();

  const updatedUser = toAuthUser(result[0]);
  await setAuthCookie(c, updatedUser);

  return c.json({ user: updatedUser });
});

export default app;
