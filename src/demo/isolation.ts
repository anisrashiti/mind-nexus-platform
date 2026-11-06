import 'server-only';
import { eq, ne } from 'drizzle-orm';
import { db, type Database } from '@/lib/db/client';
import { organizations, users } from '@/lib/db/schema';
import { DEMO_ORGANIZATION_ID } from './config';

export async function isDemoDatabase(database: Pick<Database, 'select'> = db()) {
  const [realUsers, otherOrganizations] = await Promise.all([
    database.select({ id: users.id }).from(users).where(eq(users.isDemo, false)).limit(1),
    database
      .select({ id: organizations.id })
      .from(organizations)
      .where(ne(organizations.id, DEMO_ORGANIZATION_ID))
      .limit(1),
  ]);
  return realUsers.length === 0 && otherOrganizations.length === 0;
}
export async function assertDemoDatabase(database: Pick<Database, 'select'> = db()) {
  if (!(await isDemoDatabase(database)))
    throw new Error('Demo mode requires a separate demo-only database');
}
