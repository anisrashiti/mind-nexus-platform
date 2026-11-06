import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';
config({ path: ['.env.local', '.env'], quiet: true });
export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
});
