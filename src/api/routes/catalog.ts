import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, asc } from 'drizzle-orm';
import { menuCatalog, catalogIngredients, users } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };
const app = new Hono<Env>();
app.use('*', authMiddleware);

// List all catalog menus
app.get('/', async (c) => {
  const db = drizzle(c.env.DB);

  const menus = await db.select({
    id: menuCatalog.id,
    name: menuCatalog.name,
    description: menuCatalog.description,
    recipe: menuCatalog.recipe,
    createdBy: menuCatalog.createdBy,
    createdAt: menuCatalog.createdAt,
    creatorName: users.displayName,
  })
    .from(menuCatalog)
    .leftJoin(users, eq(menuCatalog.createdBy, users.id))
    .orderBy(asc(menuCatalog.name))
    .all();

  // Fetch ingredient counts for each menu
  const allIngredients = await db.select().from(catalogIngredients).all();
  const ingredientCountMap = new Map<number, number>();
  const totalPriceMap = new Map<number, number>();
  for (const ing of allIngredients) {
    ingredientCountMap.set(ing.catalogMenuId, (ingredientCountMap.get(ing.catalogMenuId) || 0) + 1);
    totalPriceMap.set(ing.catalogMenuId, (totalPriceMap.get(ing.catalogMenuId) || 0) + ing.totalPrice);
  }

  const enriched = menus.map(m => ({
    ...m,
    ingredientCount: ingredientCountMap.get(m.id) || 0,
    estimatedPrice: totalPriceMap.get(m.id) || 0,
  }));

  return c.json({ menus: enriched });
});

// Get single catalog menu with ingredients
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const menu = await db.select({
    id: menuCatalog.id,
    name: menuCatalog.name,
    description: menuCatalog.description,
    recipe: menuCatalog.recipe,
    createdBy: menuCatalog.createdBy,
    createdAt: menuCatalog.createdAt,
    creatorName: users.displayName,
  })
    .from(menuCatalog)
    .leftJoin(users, eq(menuCatalog.createdBy, users.id))
    .where(eq(menuCatalog.id, id))
    .get();

  if (!menu) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  const ings = await db.select().from(catalogIngredients)
    .where(eq(catalogIngredients.catalogMenuId, id))
    .all();

  return c.json({
    menu: {
      ...menu,
      ingredients: ings,
      estimatedPrice: ings.reduce((sum, i) => sum + i.totalPrice, 0),
    },
  });
});

// Create catalog menu
const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  recipe: z.string().optional(),
});

app.post('/', zValidator('json', createSchema), async (c) => {
  const user = (c as any).get('user') as AuthUser;
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.insert(menuCatalog).values({
    name: body.name,
    description: body.description || null,
    recipe: body.recipe || null,
    createdBy: user.id,
  }).returning();

  return c.json({ menu: result[0] }, 201);
});

// Update catalog menu
app.patch('/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  recipe: z.string().optional(),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.update(menuCatalog)
    .set(body)
    .where(eq(menuCatalog.id, id))
    .returning();

  if (!result.length) return c.json({ error: 'Menu tidak ditemukan' }, 404);
  return c.json({ menu: result[0] });
});

// Delete catalog menu (cascade ingredients)
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const menu = await db.select().from(menuCatalog).where(eq(menuCatalog.id, id)).get();
  if (!menu) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  await db.delete(catalogIngredients).where(eq(catalogIngredients.catalogMenuId, id));
  await db.delete(menuCatalog).where(eq(menuCatalog.id, id));

  return c.json({ message: 'Menu katalog dihapus' });
});

// --- Catalog Ingredients ---

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  pricePerUnit: z.number().min(0),
});

// Add ingredient to catalog menu
app.post('/:id/ingredients', zValidator('json', ingredientSchema), async (c) => {
  const catalogMenuId = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const menu = await db.select().from(menuCatalog).where(eq(menuCatalog.id, catalogMenuId)).get();
  if (!menu) return c.json({ error: 'Menu tidak ditemukan' }, 404);

  const totalPrice = body.quantity * body.pricePerUnit;
  const result = await db.insert(catalogIngredients).values({
    catalogMenuId,
    name: body.name,
    quantity: body.quantity,
    unit: body.unit,
    pricePerUnit: body.pricePerUnit,
    totalPrice,
  }).returning();

  return c.json({ ingredient: result[0] }, 201);
});

// Update catalog ingredient
app.patch('/ingredients/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  pricePerUnit: z.number().min(0).optional(),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(catalogIngredients).where(eq(catalogIngredients.id, id)).get();
  if (!existing) return c.json({ error: 'Bahan tidak ditemukan' }, 404);

  const qty = body.quantity ?? existing.quantity;
  const price = body.pricePerUnit ?? existing.pricePerUnit;

  const result = await db.update(catalogIngredients).set({
    ...body,
    totalPrice: qty * price,
  }).where(eq(catalogIngredients.id, id)).returning();

  return c.json({ ingredient: result[0] });
});

// Delete catalog ingredient
app.delete('/ingredients/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const db = drizzle(c.env.DB);

  const existing = await db.select().from(catalogIngredients).where(eq(catalogIngredients.id, id)).get();
  if (!existing) return c.json({ error: 'Bahan tidak ditemukan' }, 404);

  await db.delete(catalogIngredients).where(eq(catalogIngredients.id, id));
  return c.json({ message: 'Bahan dihapus' });
});

export default app;
