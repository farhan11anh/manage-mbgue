import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  displayName: text('display_name').notNull(),
  password: text('password').notNull(),
  avatarUrl: text('avatar_url'),
  isAdmin: integer('is_admin').notNull().default(0),
  isApproved: integer('is_approved').notNull().default(0),
  mustChangePassword: integer('must_change_password').notNull().default(0),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const weeks = sqliteTable('weeks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  label: text('label').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Katalog menu — library menu yang bisa dipakai ulang
export const menuCatalog = sqliteTable('menu_catalog', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  recipe: text('recipe'),
  createdBy: integer('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Bahan untuk menu di katalog (template)
export const catalogIngredients = sqliteTable('catalog_ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  catalogMenuId: integer('catalog_menu_id').notNull().references(() => menuCatalog.id),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  pricePerUnit: real('price_per_unit').notNull(),
  totalPrice: real('total_price').notNull(),
});

// Assignment menu ke hari tertentu dalam minggu
export const menuProposals = sqliteTable('menu_proposals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  weekId: integer('week_id').notNull().references(() => weeks.id),
  catalogMenuId: integer('catalog_menu_id').references(() => menuCatalog.id),
  proposedBy: integer('proposed_by').notNull().references(() => users.id),
  dayOfWeek: text('day_of_week').notNull(),
  mealType: text('meal_type').notNull(),
  menuName: text('menu_name').notNull(),
  actualMenuName: text('actual_menu_name'),
  description: text('description'),
  note: text('note'),
  status: text('status').notNull().default('proposed'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// Bahan aktual (hanya untuk menu yang benar-benar dimasak)
export const ingredients = sqliteTable('ingredients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  menuProposalId: integer('menu_proposal_id').notNull().references(() => menuProposals.id),
  name: text('name').notNull(),
  quantity: real('quantity').notNull(),
  unit: text('unit').notNull(),
  pricePerUnit: real('price_per_unit').notNull(),
  totalPrice: real('total_price').notNull(),
  isActual: integer('is_actual').notNull().default(0),
});

export const votes = sqliteTable('votes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  menuProposalId: integer('menu_proposal_id').notNull().references(() => menuProposals.id),
  userId: integer('user_id').notNull().references(() => users.id),
  voteType: text('vote_type').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
  uniqueVote: uniqueIndex('unique_vote').on(table.menuProposalId, table.userId),
}));

export const comments = sqliteTable('comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  menuProposalId: integer('menu_proposal_id').notNull().references(() => menuProposals.id),
  userId: integer('user_id').notNull().references(() => users.id),
  parentId: integer('parent_id'),
  content: text('content').notNull(),
  isEdited: integer('is_edited').notNull().default(0),
  deletedAt: text('deleted_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});
