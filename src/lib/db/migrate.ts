import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
config({ path: ['.env.local', '.env'], quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const connection = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(connection), { migrationsFolder: 'src/lib/db/migrations' });
    console.info('Migrations applied');
  } finally {
    await connection.end();
  }
}
main().catch(() => {
  console.error('Migration failed. Check DATABASE_URL in .env.local, .env, or the process environment.');
  process.exitCode = 1;
});
