import 'server-only';
import { and, eq, gt, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db/client';
import { users, appointments, psychologistProfiles, type User } from '@/lib/db/schema';
import { getRemaining } from './allowance';
export async function publicPsychologist() {
  const [profile] = await db()
    .select({
      id: users.id,
      fullName: users.fullName,
      title: psychologistProfiles.title,
      bio: psychologistProfiles.bio,
      languages: psychologistProfiles.languages,
    })
    .from(users)
    .innerJoin(psychologistProfiles, eq(users.id, psychologistProfiles.userId))
    .where(and(eq(users.role, 'psychologist'), eq(users.status, 'active')))
    .limit(1);
  return profile;
}
export async function employeeBookingState(employee: User, now = new Date()) {
  const where = and(
    eq(appointments.employeeId, employee.id),
    eq(appointments.organizationId, employee.organizationId!),
  );
  const [remaining, upcoming, past] = await Promise.all([
    getRemaining(employee.id),
    db()
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
      })
      .from(appointments)
      .where(and(where, eq(appointments.status, 'confirmed'), gt(appointments.endsAt, now)))
      .orderBy(appointments.startsAt)
      .limit(1),
    db()
      .select({
        id: appointments.id,
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
        outcome: appointments.outcome,
      })
      .from(appointments)
      .where(where)
      .orderBy(desc(appointments.startsAt))
      .limit(1),
  ]);
  return { remaining, appointment: upcoming[0], past: past[0] };
}
export async function requireBookable(employee: User) {
  const state = await employeeBookingState(employee);
  if (state.remaining < 1 || state.appointment) redirect('/');
  return state;
}
