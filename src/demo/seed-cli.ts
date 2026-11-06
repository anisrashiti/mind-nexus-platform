import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/db/schema';
import { seedDemoData } from './seed';
config({ path: ['.env.local', '.env'], quiet: true });

async function main() {
  if (process.env.DEMO_MODE !== 'true' || !process.env.DATABASE_URL)
    throw new Error('Demo seed configuration missing');
  const connection = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  try {
    await seedDemoData(drizzle(connection, { schema }));
    console.info('Demo sample data ready');
  } finally {
    await connection.end();
  }
}
main().catch(() => {
  console.error(
    'Demo seed failed. Check DEMO_MODE, DATABASE_URL and ENCRYPTION_KEY in .env.local or .env; use a migrated, separate demo-only database.',
  );
  process.exitCode = 1;
});
