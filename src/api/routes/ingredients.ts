import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql } from 'drizzle-orm';
import { ingredients } from '../db/schema';
import { authMiddleware } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };

// Sub-router for /api/menus/:menuId/ingredients
export const menuIngredients = new Hono<Env>();
menuIngredients.use('*', authMiddleware);

menuIngredients.get('/', async (c) => {
  const menuId = parseInt(c.req.param('menuId') ?? '0');
  const isActual = c.req.query('actual') === '1' ? 1 : 0;
  const db = drizzle(c.env.DB);
  const items = await db.select().from(ingredients)
    .where(sql`${ingredients.menuProposalId} = ${menuId} AND ${ingredients.isActual} = ${isActual}`).all();
  return c.json({ ingredients: items });
});

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.number().min(0),
  isActual: z.number().optional(),
});

menuIngredients.post('/', zValidator('json', ingredientSchema), async (c) => {
  const menuId = parseInt(c.req.param('menuId') ?? '0');
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const totalPrice = body.quantity * body.pricePerUnit;
  const result = await db.insert(ingredients).values({
    menuProposalId: menuId,
    name: body.name,
    quantity: body.quantity,
    unit: body.unit,
    pricePerUnit: body.pricePerUnit,
    isActual: body.isActual ?? 0,
    totalPrice,
  }).returning();

  return c.json({ ingredient: result[0] }, 201);
});

// Main ingredients router for /api/ingredients/:id
const app = new Hono<Env>();
app.use('*', authMiddleware);

app.patch('/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  pricePerUnit: z.number().min(0).optional(),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(ingredients).where(eq(ingredients.id, id)).get();
  if (!existing) return c.json({ error: 'Bahan tidak ditemukan' }, 404);

  const qty = body.quantity ?? existing.quantity;
  const price = body.pricePerUnit ?? existing.pricePerUnit;

  const result = await db.update(ingredients).set({
    ...body,
    totalPrice: qty * price,
  }).where(eq(ingredients.id, id)).returning();

  return c.json({ ingredient: result[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(ingredients).where(eq(ingredients.id, id)).get();
  if (!existing) return c.json({ error: 'Bahan tidak ditemukan' }, 404);

  await db.delete(ingredients).where(eq(ingredients.id, id));
  return c.json({ message: 'Bahan dihapus' });
});

export default app;
