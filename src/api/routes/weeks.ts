import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, and, lte, gte, sql, inArray } from 'drizzle-orm';
import { weeks, menuProposals, votes, ingredients } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();

app.use('*', authMiddleware);

const DAY_INDEX: Record<string, number> = {
  'Senin': 0, 'Selasa': 1, 'Rabu': 2, 'Kamis': 3,
  'Jumat': 4, 'Sabtu': 5, 'Minggu': 6,
};

const MEAL_INDEX: Record<string, number> = {
  'Sarapan': 0,
  'Makan Siang': 1,
  'Makan Malam': 2,
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
  const user = (c as any).get('user') as AuthUser;
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

app.get('/:weekId/summary', async (c) => {
  const weekId = parseInt(c.req.param('weekId'));
  const db = drizzle(c.env.DB);

  const week = await db.select().from(weeks).where(eq(weeks.id, weekId)).get();
  if (!week) {
    return c.json({ error: 'Minggu tidak ditemukan' }, 404);
  }

  const allMenus = await db.select({
    id: menuProposals.id,
    day: menuProposals.dayOfWeek,
    meal: menuProposals.mealType,
    menuName: menuProposals.menuName,
    actualMenuName: menuProposals.actualMenuName,
  }).from(menuProposals).where(eq(menuProposals.weekId, weekId)).all();

  const sortedMenus = [...allMenus].sort((a, b) => {
    const dayDiff = (DAY_INDEX[a.day] ?? 99) - (DAY_INDEX[b.day] ?? 99);
    if (dayDiff !== 0) return dayDiff;
    return (MEAL_INDEX[a.meal] ?? 99) - (MEAL_INDEX[b.meal] ?? 99);
  });

  if (!sortedMenus.length) {
    return c.json({ weekLabel: week.label, menus: [], ingredients: [], grandTotal: 0 });
  }

  const menuIds = sortedMenus.map((menu) => menu.id);
  const allIngredients = await db.select().from(ingredients)
    .where(inArray(ingredients.menuProposalId, menuIds)).all();

  const ingredientMap = new Map<string, { name: string; totalQty: number; unit: string; totalPrice: number }>();

  for (const menu of sortedMenus) {
    const menuItems = allIngredients.filter((item) => item.menuProposalId === menu.id);
    const actualItems = menuItems.filter((item) => item.isActual === 1);
    const proposalItems = menuItems.filter((item) => item.isActual === 0);
    const chosenItems = actualItems.length ? actualItems : proposalItems;

    for (const item of chosenItems) {
      const key = `${item.name.toLowerCase()}::${item.unit.toLowerCase()}`;
      const current = ingredientMap.get(key) ?? {
        name: item.name,
        totalQty: 0,
        unit: item.unit,
        totalPrice: 0,
      };

      current.totalQty += item.quantity;
      current.totalPrice += item.totalPrice;
      ingredientMap.set(key, current);
    }
  }

  const summaryIngredients = Array.from(ingredientMap.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'id'));
  const grandTotal = summaryIngredients.reduce((sum, item) => sum + item.totalPrice, 0);

  return c.json({
    weekLabel: week.label,
    menus: sortedMenus.map(({ id: _id, ...menu }) => menu),
    ingredients: summaryIngredients,
    grandTotal,
  });
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
