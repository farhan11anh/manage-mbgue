import { Config } from 'drizzle-kit';

export default {
  schema: './src/api/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
} satisfies Config;
