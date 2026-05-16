import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lte, gte, sql } from 'drizzle-orm';
import { weeks, menuProposals, votes } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();

app.use('*', authMiddleware);

const DAY_INDEX: Record<string, number> = {
  'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3,
  'Jumat': 4, 'Sabtu': 5, 'Minggu': 6,
};

// Hitung tanggal menu dari startDate + dayOfWeek
function getMenuDate(startDate: string, dayOfWeek: string): Date {
  const start = new Date(startDate + 'T00:00:00Z');
  const offset = DAY_INDEX[dayOfWeek] ?? 0;
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + offset);
  return d;
}

// Auto-approve: jika sudah H-1 dan tidak ada vote down → approved
async function autoApproveMenus(db: ReturnType<typeof drizzle>, weekData: any, menus: any[]) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const menu of menus) {
    if (menu.status !== 'proposed') continue;

    const menuDate = getMenuDate(weekData.startDate, menu.dayOfWeek);
    const deadline = new Date(menuDate);
    deadline.setUTCDate(deadline.getUTCDate() - 1); // H-1

    if (today >= deadline) {
      const downVotes = await db.select({ count: sql<number>`count(*)` }).from(votes)
        .where(sql`${votes.menuProposalId} = ${menu.id} AND ${votes.voteType} = 'down'`).get();

      if ((downVotes?.count ?? 0) === 0) {
        await db.update(menuProposals)
          .set({ status: 'approved' })
          .where(eq(menuProposals.id, menu.id));
        menu.status = 'approved';
      }
    }
  }
}

// Tandai apakah menu diusulkan telat dan apakah sudah terkunci
function enrichMenus(menus: any[], weekData: any) {
  const weekStart = new Date(weekData.startDate + 'T00:00:00Z');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  return menus.map(m => {
    const menuDate = getMenuDate(weekData.startDate, m.dayOfWeek);
    const deadline = new Date(menuDate);
    deadline.setUTCDate(deadline.getUTCDate() - 1); // H-1
    const isLocked = m.status === 'approved' || m.status === 'rejected' || today >= deadline;

    return {
      ...m,
      isLateProposal: new Date(m.createdAt) >= weekStart,
      isLocked,
    };
  });
}

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

  // Auto-approve eligible menus
  await autoApproveMenus(db, week, menus);

  return c.json({ week, menus: enrichMenus(menus, week) });
});

export default app;
