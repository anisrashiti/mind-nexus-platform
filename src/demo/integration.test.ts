import 'dotenv/config';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { eq } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';
import { getRemaining } from '@/lib/booking/allowance';
import { decrypt } from '@/lib/crypto';
import { seedDemoData, demoSignInUser } from './seed';
import { DEMO_VIEWS, DEMO_VIEW_KEYS, DEMO_ORGANIZATION_ID } from './config';

describe.runIf(!!process.env.TEST_DATABASE_URL)('isolated demo seed and reset', () => {
  let connection: ReturnType<typeof postgres>;
  let admin: ReturnType<typeof postgres>;
  let database: ReturnType<typeof drizzle<typeof schema>>;
  const databaseName = `demo_${randomUUID().replaceAll('-', '')}_test`;
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !url.pathname.endsWith('_test')
    )
      throw new Error('A loopback test database is required');
    admin = postgres(url.toString(), { max: 1, onnotice: () => {} });
    await admin.unsafe(`CREATE DATABASE "${databaseName}"`);
    url.pathname = `/${databaseName}`;
    connection = postgres(url.toString(), { max: 1, onnotice: () => {} });
    database = drizzle(connection, { schema });
    await migrate(database, { migrationsFolder: 'src/lib/db/migrations' });
    vi.stubEnv('DEMO_MODE', 'true');
    vi.stubEnv('ENCRYPTION_KEY', randomBytes(32).toString('base64'));
  });
  afterAll(async () => {
    vi.unstubAllEnvs();
    if (connection) await connection.end();
    if (admin) {
      await admin.unsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
      await admin.end();
    }
  });
  const now = new Date('2026-11-06T10:05:00Z');
  it('creates all five views, exact allowances, encrypted urgent examples and sample schedules', async () => {
    await seedDemoData(database, now);
    const users = await database.select().from(schema.users);
    expect(users).toHaveLength(10);
    expect(users.every((u) => u.isDemo && !u.passwordHash)).toBe(true);
    for (const view of DEMO_VIEW_KEYS)
      expect((await demoSignInUser(view, database)).id).toBe(DEMO_VIEWS[view].id);
    for (const [view, remaining] of [
      ['available', 1],
      ['booked', 0],
      ['used', 0],
    ] as const)
      expect(await database.transaction((tx) => getRemaining(DEMO_VIEWS[view].id, tx))).toBe(
        remaining,
      );
    const rows = await database.select().from(schema.appointments);
    expect(rows).toHaveLength(4);
    expect(rows.filter((a) => a.status === 'confirmed')).toHaveLength(2);
    expect(rows.find((a) => a.status === 'no_show')?.outcome).toBe('pending');
    expect(
      rows.every(
        (a) => +a.endsAt - +a.startsAt === 50 * 60000 && a.startsAt.getUTCMinutes() % 30 === 0,
      ),
    ).toBe(true);
    expect(await database.select().from(schema.availabilityRules)).toHaveLength(7);
    const messages = await database.select().from(schema.urgentMessages);
    expect(messages.filter((m) => m.handledAt)).toHaveLength(1);
    expect(
      messages.every(
        (m) => m.bodyEnc.startsWith('v1.') && decrypt(m.bodyEnc).startsWith('Sample message:'),
      ),
    ).toBe(true);
    expect((await database.select().from(schema.organizations))[0].sessionsPerEmployee).toBe(1);
  });
  it('resets changes and sessions while preserving append-only audit history and stable user IDs', async () => {
    await database
      .update(schema.organizations)
      .set({ sessionsPerEmployee: 4 })
      .where(eq(schema.organizations.id, DEMO_ORGANIZATION_ID));
    await database.insert(schema.sessions).values({
      sessionToken: 'synthetic-hashed-token',
      userId: DEMO_VIEWS.booked.id,
      expires: new Date(+now + 3600000),
    });
    const [audit] = await database
      .insert(schema.auditLog)
      .values({
        actorId: DEMO_VIEWS.psychologist.id,
        action: 'demo.test',
        entity: 'organizations',
        entityId: DEMO_ORGANIZATION_ID,
      })
      .returning();
    await seedDemoData(database, now);
    expect(await database.select().from(schema.sessions)).toHaveLength(0);
    expect(await database.select().from(schema.users)).toHaveLength(10);
    expect(await database.select().from(schema.appointments)).toHaveLength(4);
    expect(await database.select().from(schema.sessionLedger)).toHaveLength(4);
    expect(
      await database.select().from(schema.auditLog).where(eq(schema.auditLog.id, audit.id)),
    ).toHaveLength(1);
    expect((await database.select().from(schema.organizations))[0].sessionsPerEmployee).toBe(1);
  });
  it('rejects real accounts, a mixed database and disabled seeding without changing records', async () => {
    await database
      .update(schema.users)
      .set({ isDemo: false })
      .where(eq(schema.users.id, DEMO_VIEWS.available.id));
    await expect(demoSignInUser('available', database)).rejects.toThrow();
    await expect(seedDemoData(database, now)).rejects.toThrow();
    expect(
      (
        await database
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, DEMO_VIEWS.available.id))
      )[0].isDemo,
    ).toBe(false);
    vi.stubEnv('DEMO_MODE', 'false');
    await expect(seedDemoData(database, now)).rejects.toThrow('disabled');
    await expect(demoSignInUser('hr', database)).rejects.toThrow('disabled');
  });
  it('verifies the documented cleanup refuses real data and removes demo records without disabling audit protection', async () => {
    const document = readFileSync(new URL('../../DEMO_REMOVAL.md', import.meta.url), 'utf8');
    const cleanup = document.split('```sql\n')[1].split('```')[0];
    try {
      await expect(connection.unsafe(cleanup).simple()).rejects.toThrow('Refusing demo cleanup');
    } finally {
      await connection.unsafe('ROLLBACK');
    }
    expect(await database.select().from(schema.users)).toHaveLength(10);
    await database
      .update(schema.users)
      .set({ isDemo: true })
      .where(eq(schema.users.id, DEMO_VIEWS.available.id));
    await connection.unsafe(cleanup).simple();
    for (const table of [
      schema.users,
      schema.organizations,
      schema.appointments,
      schema.sessionLedger,
      schema.urgentMessages,
      schema.sessions,
    ])
      expect(await database.select().from(table)).toHaveLength(0);
    const [trigger] =
      await connection`select tgenabled from pg_trigger where tgname = 'audit_append_only'`;
    expect(trigger.tgenabled).toBe('O');
  });
});
