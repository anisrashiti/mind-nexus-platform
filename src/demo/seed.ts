import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db, type Database } from '@/lib/db/client';
import * as s from '@/lib/db/schema';
import { encrypt, hashToken, newToken } from '@/lib/crypto';
import { placeholders } from '@/content/placeholders';
import en from '../../messages/en.json';
import { localDate, localInstant, nextDate } from '@/lib/dates';
import { demoEnabled, DEMO_ORGANIZATION_ID, DEMO_VIEWS } from './config';
import { assertDemoDatabase } from './isolation';

const sampleId = (number: number) => `de000000-0000-4000-8000-${String(number).padStart(12, '0')}`;
export function demoAppointmentTimes(now: Date) {
  const soon = new Date(Math.ceil((+now + 1) / 1800000) * 1800000);
  // TODO(question): At the end of the Kosovo day, upcoming examples roll into tomorrow; preserve real slot/join rules.
  return {
    soon,
    later: new Date(+soon + 3600000),
    missed: new Date(+soon - 2 * 3600000),
    completed: new Date(+soon - 86400000),
  };
}
export async function seedDemoData(database: Database = db(), now = new Date()) {
  if (!demoEnabled()) throw new Error('Demo mode is disabled');
  return database.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(73190426)`);
    await tx.execute(sql`lock table users, organizations in share row exclusive mode`);
    await assertDemoDatabase(tx);
    const existing = await tx
      .select({ id: s.users.id })
      .from(s.users)
      .where(eq(s.users.isDemo, true))
      .for('update');
    const ids = existing.map((u) => u.id);
    if (ids.length) {
      await tx.delete(s.sessions).where(inArray(s.sessions.userId, ids));
      await tx.delete(s.accounts).where(inArray(s.accounts.userId, ids));
      await tx.delete(s.passwordResets).where(inArray(s.passwordResets.userId, ids));
      await tx.delete(s.consents).where(inArray(s.consents.userId, ids));
      await tx.delete(s.urgentMessages).where(inArray(s.urgentMessages.employeeId, ids));
      await tx.delete(s.sessionLedger).where(inArray(s.sessionLedger.employeeId, ids));
      await tx.delete(s.appointments).where(inArray(s.appointments.employeeId, ids));
      await tx.delete(s.timeOff).where(inArray(s.timeOff.psychologistId, ids));
      await tx.delete(s.availabilityRules).where(inArray(s.availabilityRules.psychologistId, ids));
      await tx.delete(s.invites).where(eq(s.invites.organizationId, DEMO_ORGANIZATION_ID));
      // Keep stable user IDs and append-only audit history, including identities created during a preview.
      await tx
        .update(s.users)
        .set({ status: 'deactivated', passwordHash: null })
        .where(eq(s.users.isDemo, true));
    }
    await tx
      .insert(s.organizations)
      .values({
        id: DEMO_ORGANIZATION_ID,
        name: en.demo.sample.organization,
        hrContactName: en.demo.sample.hr,
        hrContactEmail: 'demo.hr@example.invalid',
        sessionsPerEmployee: 1,
      })
      .onConflictDoUpdate({
        target: s.organizations.id,
        set: {
          name: en.demo.sample.organization,
          hrContactName: en.demo.sample.hr,
          hrContactEmail: 'demo.hr@example.invalid',
          sessionsPerEmployee: 1,
          status: 'active',
        },
      });
    const definitions = [
      { ...DEMO_VIEWS.psychologist, name: en.profile.name, slug: 'psychologist', isAdmin: true },
      { ...DEMO_VIEWS.hr, name: en.demo.sample.hr, slug: 'hr' },
      { ...DEMO_VIEWS.available, name: en.demo.sample.available, slug: 'available' },
      { ...DEMO_VIEWS.booked, name: en.demo.sample.booked, slug: 'booked' },
      { ...DEMO_VIEWS.used, name: en.demo.sample.used, slug: 'used' },
      { id: sampleId(21), role: 'employee', name: en.demo.sample.later, slug: 'later' },
      { id: sampleId(22), role: 'employee', name: en.demo.sample.missed, slug: 'missed' },
      {
        id: sampleId(23),
        role: 'employee',
        name: en.demo.sample.invited,
        slug: 'invited',
        status: 'invited',
      },
      {
        id: sampleId(24),
        role: 'employee',
        name: en.demo.sample.deactivated,
        slug: 'deactivated',
        status: 'deactivated',
      },
      { id: sampleId(25), role: 'employee', name: en.demo.sample.active, slug: 'active' },
    ] satisfies {
      id: string;
      role: s.User['role'];
      name: string;
      slug: string;
      isAdmin?: boolean;
      status?: s.User['status'];
    }[];
    for (const definition of definitions) {
      const user = {
        fullName: definition.name,
        email: `demo.${definition.slug}@example.invalid`,
        organizationId: definition.role === 'psychologist' ? null : DEMO_ORGANIZATION_ID,
        role: definition.role,
        isAdmin: 'isAdmin' in definition && !!definition.isAdmin,
        isDemo: true,
        passwordHash: null,
        locale: 'en' as const,
        status: 'status' in definition ? definition.status : ('active' as const),
        invitedAt: new Date(+now - 7 * 86400000),
        activatedAt: 'status' in definition ? null : new Date(+now - 6 * 86400000),
      };
      await tx
        .insert(s.users)
        .values({ id: definition.id, ...user })
        .onConflictDoUpdate({ target: s.users.id, set: user });
    }
    const psychologistId = DEMO_VIEWS.psychologist.id;
    await tx
      .insert(s.psychologistProfiles)
      .values({
        userId: psychologistId,
        title: en.profile.title,
        languages: ['Albanian'],
        bio: en.profile.bio,
      })
      .onConflictDoUpdate({
        target: s.psychologistProfiles.userId,
        set: {
          title: en.profile.title,
          languages: ['Albanian'],
          bio: en.profile.bio,
        },
      });
    await tx.insert(s.availabilityRules).values(
      placeholders.weeklyHours.map(([weekday, startTime, endTime]) => ({
        psychologistId,
        weekday,
        startTime,
        endTime,
      })),
    );
    await tx.insert(s.timeOff).values({
      psychologistId,
      startsAt: localInstant(nextDate(localDate(now), 5), '09:00'),
      endsAt: localInstant(nextDate(localDate(now), 5), '17:00'),
      label: en.demo.sample.timeOff,
    });
    const times = demoAppointmentTimes(now);
    const examples = [
      { employeeId: DEMO_VIEWS.booked.id, startsAt: times.soon, status: 'confirmed' as const },
      { employeeId: sampleId(21), startsAt: times.later, status: 'confirmed' as const },
      { employeeId: sampleId(22), startsAt: times.missed, status: 'no_show' as const },
      { employeeId: DEMO_VIEWS.used.id, startsAt: times.completed, status: 'completed' as const },
    ];
    for (const example of examples) {
      const [appointment] = await tx
        .insert(s.appointments)
        .values({
          ...example,
          psychologistId,
          organizationId: DEMO_ORGANIZATION_ID,
          endsAt: new Date(+example.startsAt + 50 * 60000),
          outcome: example.status === 'no_show' ? 'pending' : 'none',
          employeeJoinedAt: example.status === 'completed' ? example.startsAt : null,
          psychologistJoinedAt: example.status === 'completed' ? example.startsAt : null,
          createdAt: new Date(+example.startsAt - 48 * 3600000),
        })
        .returning();
      await tx.insert(s.sessionLedger).values({
        employeeId: example.employeeId,
        appointmentId: appointment.id,
        amount: -1,
        reason: 'booking',
        createdBy: psychologistId,
      });
      await tx.insert(s.consents).values({
        userId: example.employeeId,
        version: placeholders.consentVersion,
        acceptedAt: new Date(+example.startsAt - 48 * 3600000),
      });
    }
    await tx.insert(s.invites).values({
      organizationId: DEMO_ORGANIZATION_ID,
      email: 'demo.invited@example.invalid',
      tokenHash: hashToken(newToken()),
      invitedBy: DEMO_VIEWS.hr.id,
      expiresAt: new Date(+now + 14 * 86400000),
    });
    await tx.insert(s.urgentMessages).values([
      {
        employeeId: DEMO_VIEWS.available.id,
        bodyEnc: encrypt(en.demo.sample.newMessage),
        createdAt: new Date(+now - 20 * 60000),
      },
      {
        employeeId: DEMO_VIEWS.used.id,
        bodyEnc: encrypt(en.demo.sample.handledMessage),
        createdAt: new Date(+now - 86400000),
        readAt: new Date(+now - 23 * 3600000),
        handledAt: new Date(+now - 22 * 3600000),
        handledBy: psychologistId,
      },
    ]);
    await tx.insert(s.auditLog).values({
      actorId: null,
      action: 'demo.reset',
      entity: 'organizations',
      entityId: DEMO_ORGANIZATION_ID,
    });
  });
}

export async function demoSignInUser(view: keyof typeof DEMO_VIEWS, database: Database = db()) {
  if (!demoEnabled()) throw new Error('Demo mode is disabled');
  await assertDemoDatabase(database);
  const definition = DEMO_VIEWS[view];
  const [user] = await database
    .select()
    .from(s.users)
    .where(
      and(
        eq(s.users.id, definition.id),
        eq(s.users.role, definition.role),
        eq(s.users.isDemo, true),
        eq(s.users.status, 'active'),
      ),
    );
  if (!user || (user.role === 'psychologist' && !user.isAdmin))
    throw new Error('Demo view is unavailable');
  return user;
}
