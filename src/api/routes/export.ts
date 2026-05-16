import { Hono } from 'hono';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import * as XLSX from 'xlsx';
import { weeks, menuProposals, ingredients, votes, users } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();

app.use('*', authMiddleware);

app.get('/:weekId/export', async (c) => {
  const weekId = parseInt(c.req.param('weekId'));
  const db = drizzle(c.env.DB);

  const week = await db.select().from(weeks).where(eq(weeks.id, weekId)).get();
  if (!week) return c.json({ error: 'Minggu tidak ditemukan' }, 404);

  const menus = await db.select().from(menuProposals).where(eq(menuProposals.weekId, weekId)).all();

  // Sheet 1: Rekap Menu Mingguan
  const sheet1Data = [];
  for (const menu of menus) {
    const proposer = await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, menu.proposedBy)).get();
    const up = await db.select({ count: sql<number>`count(*)` }).from(votes)
      .where(sql`${votes.menuProposalId} = ${menu.id} AND ${votes.voteType} = 'up'`).get();
    const down = await db.select({ count: sql<number>`count(*)` }).from(votes)
      .where(sql`${votes.menuProposalId} = ${menu.id} AND ${votes.voteType} = 'down'`).get();

    sheet1Data.push({
      'Hari': menu.dayOfWeek,
      'Jenis Makan': menu.mealType,
      'Nama Menu': menu.menuName,
      'Diusulkan Oleh': proposer?.displayName ?? '-',
      'Vote ↑': up?.count ?? 0,
      'Vote ↓': down?.count ?? 0,
      'Komentar': menu.description ?? '-',
      'Status': menu.status,
    });
  }

  // Sheet 2: Daftar Bahan Makanan
  const sheet2Data = [];
  for (const menu of menus) {
    const items = await db.select().from(ingredients).where(eq(ingredients.menuProposalId, menu.id)).all();
    for (const item of items) {
      sheet2Data.push({
        'Menu': menu.menuName,
        'Nama Bahan': item.name,
        'Jumlah': item.quantity,
        'Satuan': item.unit,
        'Harga/Satuan': item.pricePerUnit,
        'Total Harga': item.totalPrice,
      });
    }
  }

  // Sheet 3: Rekap Harga
  const sheet3Data = [];
  let grandTotal = 0;
  for (const menu of menus) {
    const totalResult = await db.select({ total: sql<number>`COALESCE(SUM(${ingredients.totalPrice}), 0)` })
      .from(ingredients).where(eq(ingredients.menuProposalId, menu.id)).get();
    const total = totalResult?.total ?? 0;
    grandTotal += total;
    sheet3Data.push({
      'Menu': menu.menuName,
      'Total Harga Bahan': total,
    });
  }
  sheet3Data.push({
    'Menu': 'GRAND TOTAL',
    'Total Harga Bahan': grandTotal,
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet1Data), 'Rekap Menu Mingguan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet2Data), 'Daftar Bahan Makanan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet3Data), 'Rekap Harga');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="MBG-Rekap-${week.label}.xlsx"`,
    },
  });
});

export default app;
