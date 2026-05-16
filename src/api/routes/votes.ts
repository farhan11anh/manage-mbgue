import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, sql } from 'drizzle-orm';
import { votes } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();

app.use('*', authMiddleware);

app.post('/:menuId/vote', zValidator('json', z.object({
  voteType: z.enum(['up', 'down']),
})), async (c) => {
  const menuId = parseInt(c.req.param('menuId'));
  const user = c.get('user') as AuthUser;
  const { voteType } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(votes)
    .where(and(eq(votes.menuProposalId, menuId), eq(votes.userId, user.id)))
    .get();

  if (existing) {
    if (existing.voteType === voteType) {
      // Toggle off — remove vote
      await db.delete(votes).where(eq(votes.id, existing.id));
      return c.json({ message: 'Vote dihapus', vote: null });
    }
    // Switch vote type
    const result = await db.update(votes).set({ voteType }).where(eq(votes.id, existing.id)).returning();
    return c.json({ vote: result[0] });
  }

  const result = await db.insert(votes).values({
    menuProposalId: menuId,
    userId: user.id,
    voteType,
  }).returning();

  return c.json({ vote: result[0] }, 201);
});

app.get('/:menuId/votes', authMiddleware, async (c) => {
  const menuId = parseInt(c.req.param('menuId'));
  const db = drizzle(c.env.DB);

  const up = await db.select({ count: sql<number>`count(*)` }).from(votes)
    .where(sql`${votes.menuProposalId} = ${menuId} AND ${votes.voteType} = 'up'`).get();
  const down = await db.select({ count: sql<number>`count(*)` }).from(votes)
    .where(sql`${votes.menuProposalId} = ${menuId} AND ${votes.voteType} = 'down'`).get();

  return c.json({ votes: { up: up?.count ?? 0, down: down?.count ?? 0 } });
});

export default app;
