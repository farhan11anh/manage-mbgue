import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/d1';
import { eq, sql, isNull, asc } from 'drizzle-orm';
import { comments, users } from '../db/schema';
import { authMiddleware, AuthUser } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };

// Sub-router for /api/menus/:menuId/comments
export const menuComments = new Hono<Env>();
menuComments.use('*', authMiddleware);

menuComments.get('/', async (c) => {
  const menuId = parseInt(c.req.param('menuId'));
  const db = drizzle(c.env.DB);

  const allComments = await db
    .select({
      id: comments.id,
      menuProposalId: comments.menuProposalId,
      userId: comments.userId,
      parentId: comments.parentId,
      content: comments.content,
      isEdited: comments.isEdited,
      deletedAt: comments.deletedAt,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      displayName: users.displayName,
      username: users.username,
    })
    .from(comments)
    .leftJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.menuProposalId, menuId))
    .orderBy(asc(comments.createdAt))
    .all();

  // Build nested structure (max 1 level)
  const parentComments = allComments.filter(c => !c.parentId);
  const nested = parentComments.map(parent => ({
    ...parent,
    content: parent.deletedAt ? 'Komentar ini telah dihapus' : parent.content,
    replies: allComments
      .filter(r => r.parentId === parent.id)
      .map(r => ({
        ...r,
        content: r.deletedAt ? 'Komentar ini telah dihapus' : r.content,
      })),
  }));

  return c.json({ comments: nested });
});

menuComments.post('/', zValidator('json', z.object({
  content: z.string().min(1),
})), async (c) => {
  const menuId = parseInt(c.req.param('menuId'));
  const user = c.get('user') as AuthUser;
  const { content } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const result = await db.insert(comments).values({
    menuProposalId: menuId,
    userId: user.id,
    content,
  }).returning();

  return c.json({ comment: result[0] }, 201);
});

// Main comments router for /api/comments/:id
const app = new Hono<Env>();
app.use('*', authMiddleware);

app.post('/:id/reply', zValidator('json', z.object({
  content: z.string().min(1),
})), async (c) => {
  const parentId = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const { content } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const parent = await db.select().from(comments).where(eq(comments.id, parentId)).get();
  if (!parent) return c.json({ error: 'Komentar tidak ditemukan' }, 404);

  const result = await db.insert(comments).values({
    menuProposalId: parent.menuProposalId,
    userId: user.id,
    parentId,
    content,
  }).returning();

  return c.json({ comment: result[0] }, 201);
});

app.patch('/:id', zValidator('json', z.object({
  content: z.string().min(1),
})), async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const { content } = c.req.valid('json');
  const db = drizzle(c.env.DB);

  const comment = await db.select().from(comments).where(eq(comments.id, id)).get();
  if (!comment) return c.json({ error: 'Komentar tidak ditemukan' }, 404);
  if (comment.userId !== user.id) return c.json({ error: 'Hanya penulis yang bisa mengedit' }, 403);

  const result = await db.update(comments).set({
    content,
    isEdited: 1,
    updatedAt: new Date().toISOString(),
  }).where(eq(comments.id, id)).returning();

  return c.json({ comment: result[0] });
});

app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user') as AuthUser;
  const db = drizzle(c.env.DB);

  const comment = await db.select().from(comments).where(eq(comments.id, id)).get();
  if (!comment) return c.json({ error: 'Komentar tidak ditemukan' }, 404);
  if (comment.userId !== user.id) return c.json({ error: 'Hanya penulis yang bisa menghapus' }, 403);

  // Soft delete
  await db.update(comments).set({ deletedAt: new Date().toISOString() }).where(eq(comments.id, id));
  return c.json({ message: 'Komentar dihapus' });
});

export default app;
