import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '@/lib/db/schema';
import { seedDemoData } from './seed';

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
    'Demo seed failed. Enable DEMO_MODE and use a migrated, separate demo-only database with ENCRYPTION_KEY set.',
  );
  process.exitCode = 1;
});
