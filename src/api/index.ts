import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import authRoutes from './routes/auth';
import weekRoutes from './routes/weeks';
import menuRoutes, { weekMenus } from './routes/menus';
import ingredientRoutes, { menuIngredients } from './routes/ingredients';
import voteRoutes from './routes/votes';
import commentRoutes, { menuComments } from './routes/comments';
import exportRoutes from './routes/export';

type Env = { Bindings: { DB: D1Database; JWT_SECRET: string } };

const app = new Hono<Env>();

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/weeks', weekRoutes);
app.route('/api/weeks/:weekId/menus', weekMenus);
app.route('/api/weeks', exportRoutes);
app.route('/api/menus', menuRoutes);
app.route('/api/menus/:menuId/ingredients', menuIngredients);
app.route('/api/menus', voteRoutes);
app.route('/api/menus/:menuId/comments', menuComments);
app.route('/api/comments', commentRoutes);
app.route('/api/ingredients', ingredientRoutes);

// Serve static files (built React app)
app.get('*', serveStatic({ root: './' }));
app.get('*', serveStatic({ path: './index.html' }));

export default app;
