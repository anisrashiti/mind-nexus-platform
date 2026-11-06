import 'server-only';
import { and, eq, desc, sql, gt, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { organizations, users, appointments, sessionLedger } from '@/lib/db/schema';
// TODO(question): Count completed and clinician-kept outcomes as used; pending decisions do not enter HR totals.
export const usedSessionCondition = () =>
  or(
    eq(appointments.status, 'completed'),
    and(
      sql`${appointments.status} in ('no_show','late_cancelled')`,
      eq(appointments.outcome, 'kept'),
    ),
  );
export async function singleOrganization() {
  return (await db().select().from(organizations).orderBy(organizations.createdAt).limit(1))[0];
}
export async function organizationSnapshot() {
  const org = await singleOrganization();
  if (!org) return null;
  const [employees, ledger, history] = await Promise.all([
    db()
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        status: users.status,
        activatedAt: users.activatedAt,
      })
      .from(users)
      .where(and(eq(users.organizationId, org.id), eq(users.role, 'employee')))
      .orderBy(users.fullName),
    db()
      .select({
        employeeId: sessionLedger.employeeId,
        amount: sql<number>`sum(${sessionLedger.amount})::int`,
      })
      .from(sessionLedger)
      .innerJoin(users, eq(users.id, sessionLedger.employeeId))
      .where(eq(users.organizationId, org.id))
      .groupBy(sessionLedger.employeeId),
    db()
      .select({
        employeeId: appointments.employeeId,
        status: appointments.status,
        outcome: appointments.outcome,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
      })
      .from(appointments)
      .where(eq(appointments.organizationId, org.id))
      .orderBy(desc(appointments.startsAt)),
  ]);
  const [used] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(and(eq(appointments.organizationId, org.id), usedSessionCondition()));
  const [booked] = await db()
    .select({ count: sql<number>`count(*)::int` })
    .from(appointments)
    .where(
      and(
        eq(appointments.organizationId, org.id),
        eq(appointments.status, 'confirmed'),
        gt(appointments.endsAt, new Date()),
      ),
    );
  return {
    org,
    employees: employees.map((e) => ({
      ...e,
      remaining:
        org.sessionsPerEmployee + Number(ledger.find((l) => l.employeeId === e.id)?.amount ?? 0),
      session: history.find((a) => a.employeeId === e.id)?.status ?? 'none',
    })),
    used: used.count,
    booked: booked.count,
  };
}
