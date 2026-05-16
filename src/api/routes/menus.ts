import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { menuProposals, ingredients, votes, comments, users, weeks } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };

// Sub-router for /api/weeks/:weekId/menus
export const weekMenus = new Hono<Env>();
weekMenus.use('*', authMiddleware);

weekMenus.get('/', async (c) => {
  const weekId = parseInt(c.req.param('weekId'));
  const db = drizzle(c.env.DB);
  const menus = await db.select().from(menuProposals).where(eq(menuProposals.weekId, weekId)).all();
  return c.json({ menus });
});

const menuCreateSchema = z.object({
  dayOfWeek: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']),
  mealType: z.enum(['Sarapan', 'Makan Siang', 'Makan Malam']),
  menuName: z.string().min(1),
  description: z.string().optional(),
});

weekMenus.post('/', zValidator('json', menuCreateSchema), async (c) => {
  const weekId = parseInt(c.req.param('weekId'));
  const user = c.get('user') as AuthUser;
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.insert(menuProposals).values({
    weekId,
    proposedBy: user.id,
    ...body,
  }).returning();

  return c.json({ menu: result[0] }, 201);
});

// Main menus router for /api/menus/:id
const app = new Hono<Env>();
app.use('*', authMiddleware);

app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const menu = await db.select().from(menuProposals).where(eq(menuProposals.id, id)).get();
  if (!menu) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  const week = await db.select().from(weeks).where(eq(weeks.id, menu.weekId)).get();
  const proposer = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, menu.proposedBy)).get();
  const menuIngredients = await db.select().from(ingredients)
    .where(sql`${ingredients.menuProposalId} = ${id} AND ${ingredients.isActual} = 0`).all();
  const actualIngredients = await db.select().from(ingredients)
    .where(sql`${ingredients.menuProposalId} = ${id} AND ${ingredients.isActual} = 1`).all();

  const upVotes = await db.select({ count: sql<number>`count(*)` }).from(votes)
    .where(sql`${votes.menuProposalId} = ${id} AND ${votes.voteType} = 'up'`).get();
  const downVotes = await db.select({ count: sql<number>`count(*)` }).from(votes)
    .where(sql`${votes.menuProposalId} = ${id} AND ${votes.voteType} = 'down'`).get();

  const commentCount = await db.select({ count: sql<number>`count(*)` }).from(comments)
    .where(sql`${comments.menuProposalId} = ${id} AND ${comments.deletedAt} IS NULL`).get();

  // Cek apakah diusulkan telat (setelah minggu berjalan)
  const isLateProposal = week
    ? new Date(menu.createdAt) >= new Date(week.startDate + 'T00:00:00Z')
    : false;

  // Cek apakah menu sudah terkunci (H-1 atau status final)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  let isLocked = menu.status === 'approved' || menu.status === 'rejected';
  if (!isLocked && week) {
    const DAY_IDX: Record<string, number> = {
      'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3,
      'Jumat': 4, 'Sabtu': 5, 'Minggu': 6,
    };
    const start = new Date(week.startDate + 'T00:00:00Z');
    start.setUTCDate(start.getUTCDate() + (DAY_IDX[menu.dayOfWeek] ?? 0));
    const deadline = new Date(start);
    deadline.setUTCDate(deadline.getUTCDate() - 1);
    isLocked = today >= deadline;
  }

  return c.json({
    menu: {
      ...menu,
      proposerName: proposer?.displayName,
      ingredients: menuIngredients,
      actualIngredients,
      votes: { up: upVotes?.count ?? 0, down: downVotes?.count ?? 0 },
      commentCount: commentCount?.count ?? 0,
      isLateProposal,
      isLocked,
      weekStartDate: week?.startDate,
    },
  });
});

app.patch('/:id', zValidator('json', z.object({
  menuName: z.string().min(1).optional(),
  description: z.string().optional(),
  dayOfWeek: z.enum(['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']).optional(),
  mealType: z.enum(['Sarapan', 'Makan Siang', 'Makan Malam']).optional(),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const menu = await db.select().from(menuProposals).where(eq(menuProposals.id, id)).get();
  if (!menu) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  const result = await db.update(menuProposals).set(body).where(eq(menuProposals.id, id)).returning();
  return c.json({ menu: result[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const menu = await db.select().from(menuProposals).where(eq(menuProposals.id, id)).get();
  if (!menu) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  await db.delete(ingredients).where(eq(ingredients.menuProposalId, id));
  await db.delete(votes).where(eq(votes.menuProposalId, id));
  await db.delete(comments).where(eq(comments.menuProposalId, id));
  await db.delete(menuProposals).where(eq(menuProposals.id, id));

  return c.json({ message: 'Menu dihapus' });
});

// Set menu sebenarnya (siapa saja bisa set)
app.patch('/:id/actual', zValidator('json', z.object({
  actualMenuName: z.string().min(1),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { actualMenuName } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.update(menuProposals)
    .set({ actualMenuName })
    .where(eq(menuProposals.id, id))
    .returning();
  if (!result.length) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  return c.json({ menu: result[0] });
});

app.patch('/:id/status', zValidator('json', z.object({
  status: z.enum(['proposed', 'approved', 'rejected']),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const { status } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.update(menuProposals).set({ status }).where(eq(menuProposals.id, id)).returning();
  if (!result.length) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  return c.json({ menu: result[0] });
});

export default app;
