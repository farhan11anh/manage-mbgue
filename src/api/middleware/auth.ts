import { Context, Next } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import * as jose from 'jose';
import { users } from '../db/schema';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isAdmin: number;
  mustChangePassword: number;
}

function getJwtSecret(c: Context) {
  return c.env.JWT_SECRET || 'dev-secret-key';
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'token');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const secret = new TextEncoder().encode(getJwtSecret(c));
    const { payload } = await jose.jwtVerify(token, secret);
    const userId = Number(payload.id);

    if (!userId) {
      return c.json({ error: 'Invalid token' }, 401);
    }

    const db = drizzle(c.env.DB);
    const user = await db.select({
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      isAdmin: users.isAdmin,
      mustChangePassword: users.mustChangePassword,
    }).from(users).where(eq(users.id, userId)).get();

    if (!user) {
      deleteCookie(c, 'token', { path: '/' });
      return c.json({ error: 'Unauthorized' }, 401);
    }

    c.set('user', user as AuthUser);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  const user = c.get('user') as AuthUser;
  if (!user?.isAdmin) {
    return c.json({ error: 'Akses khusus admin' }, 403);
  }

  await next();
}

export async function createToken(user: AuthUser, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return await new jose.SignJWT({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isAdmin: user.isAdmin,
    mustChangePassword: user.mustChangePassword,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function setAuthCookie(c: Context, user: AuthUser) {
  const token = await createToken(user, getJwtSecret(c));

  setCookie(c, 'token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });
}
