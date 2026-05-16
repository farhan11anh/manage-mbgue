import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import * as jose from 'jose';

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
}

export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'token');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const secret = new TextEncoder().encode(c.env.JWT_SECRET || 'dev-secret-key');
    const { payload } = await jose.jwtVerify(token, secret);
    c.set('user', payload as unknown as AuthUser);
    await next();
  } catch {
    return c.json({ error: 'Invalid token' }, 401);
  }
}

export async function createToken(user: AuthUser, secret: string): Promise<string> {
  const secretKey = new TextEncoder().encode(secret);
  return await new jose.SignJWT({ id: user.id, username: user.username, displayName: user.displayName })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secretKey);
}
