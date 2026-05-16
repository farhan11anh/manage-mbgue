import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lte, gte } from 'drizzle-orm';
import { weeks, menuProposals } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();

app.use('*', authMiddleware);

const weekSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

app.get('/', async (c) => {
  const db = drizzle(c.env.DB);
  const allWeeks = await db.select().from(weeks).all();
  return c.json({ weeks: allWeeks });
});

app.post('/', zValidator('json', weekSchema), async (c) => {
  const user = c.get('user') as AuthUser;
  const { startDate, endDate } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const label = `Minggu ${start.getDate()} – ${end.getDate()} ${end.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

  const result = await db.insert(weeks).values({
    label,
    startDate,
    endDate,
    createdBy: user.id,
  }).returning();

  return c.json({ week: result[0] }, 201);
});

app.get('/current', async (c) => {
  const db = drizzle(c.env.DB);
  const today = new Date().toISOString().split('T')[0];

  const currentWeek = await db.select().from(weeks)
    .where(and(lte(weeks.startDate, today), gte(weeks.endDate, today)))
    .get();

  if (!currentWeek) {
    return c.json({ week: null });
  }

  return c.json({ week: currentWeek });
});

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const week = await db.select().from(weeks).where(eq(weeks.id, id)).get();
  if (!week) {
    return c.json({ error: 'Minggu tidak ditemukan' }, 404);
  }

  const menus = await db.select().from(menuProposals).where(eq(menuProposals.weekId, id)).all();

  return c.json({ week, menus });
});

export default app;
