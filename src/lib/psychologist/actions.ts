'use server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requirePsychologist } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { users, appointments, organizations, sessionLedger, auditLog } from '@/lib/db/schema';
import { refundOnce } from '@/lib/booking/settle';
import { notifyCancelled } from '@/lib/booking/notifications';
import { singleOrganization } from '@/lib/organization/queries';
import { sendEmail } from '@/lib/email/send';
export async function decideOutcome(input: unknown) {
  const actor = await requirePsychologist();
  const parsed = z
    .object({ id: z.uuid(), decision: z.enum(['given_back', 'kept']) })
    .safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  await db().transaction(async (tx) => {
    const [peek] = await tx
      .select({ employeeId: appointments.employeeId })
      .from(appointments)
      .where(and(eq(appointments.id, parsed.data.id), eq(appointments.psychologistId, actor.id)));
    if (!peek) throw new Error('Unavailable');
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, peek.employeeId))
      .for('update');
    const [a] = await tx
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, parsed.data.id), eq(appointments.psychologistId, actor.id)))
      .for('update');
    if (!a || a.outcome !== 'pending' || !['late_cancelled', 'no_show'].includes(a.status)) return;
    if (parsed.data.decision === 'given_back') await refundOnce(tx, a, actor.id);
    await tx
      .update(appointments)
      .set({ outcome: parsed.data.decision })
      .where(eq(appointments.id, a.id));
    await tx.insert(auditLog).values({
      actorId: actor.id,
      action: `appointment.outcome.${parsed.data.decision}`,
      entity: 'appointments',
      entityId: a.id,
    });
  });
  revalidatePath('/psychologist');
  revalidatePath('/psychologist/organization');
  return { success: true };
}
export async function psychologistCancel(input: unknown) {
  const actor = await requirePsychologist();
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  const appointment = await db().transaction(async (tx) => {
    const [peek] = await tx
      .select({ employeeId: appointments.employeeId })
      .from(appointments)
      .where(and(eq(appointments.id, parsed.data.id), eq(appointments.psychologistId, actor.id)));
    if (!peek) return null;
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, peek.employeeId))
      .for('update');
    const [a] = await tx
      .select()
      .from(appointments)
      .where(and(eq(appointments.id, parsed.data.id), eq(appointments.psychologistId, actor.id)))
      .for('update');
    if (!a || a.status !== 'confirmed' || a.endsAt <= new Date()) return null;
    await tx
      .update(appointments)
      .set({ status: 'cancelled_by_psychologist', cancelledAt: new Date(), cancelledBy: actor.id })
      .where(eq(appointments.id, a.id));
    await refundOnce(tx, a, actor.id);
    await tx.insert(auditLog).values({
      actorId: actor.id,
      action: 'appointment.cancelled_by_psychologist',
      entity: 'appointments',
      entityId: a.id,
    });
    return a;
  });
  if (appointment)
    await notifyCancelled(appointment, false, true).catch(() =>
      console.error('email failure: cancelled', appointment.id),
    );
  revalidatePath('/psychologist');
  return { success: true };
}
export async function updateOrganization(input: unknown) {
  const actor = await requirePsychologist();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      hrContactName: z.string().trim().min(2).max(120),
      hrContactEmail: z.email().max(254),
      sessionsPerEmployee: z.number().int().min(1).max(10),
      status: z.enum(['active', 'inactive']),
    })
    .safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  const org = await singleOrganization();
  if (!org) return { error: 'invalid' };
  await db().transaction(async (tx) => {
    await tx.update(organizations).set(parsed.data).where(eq(organizations.id, org.id));
    await tx.insert(auditLog).values({
      actorId: actor.id,
      action: 'organization.updated',
      entity: 'organizations',
      entityId: org.id,
    });
  });
  revalidatePath('/psychologist/organization');
  return { success: true };
}
export async function grantExtraSession(input: unknown) {
  const actor = await requirePsychologist();
  const parsed = z.object({ employeeId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  const org = await singleOrganization();
  if (!org) return { error: 'invalid' };
  const employee = await db().transaction(async (tx) => {
    const [e] = await tx
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, parsed.data.employeeId),
          eq(users.organizationId, org.id),
          eq(users.role, 'employee'),
          eq(users.status, 'active'),
        ),
      )
      .for('update');
    if (!e) return null;
    const [entry] = await tx
      .insert(sessionLedger)
      .values({ employeeId: e.id, amount: 1, reason: 'extra', createdBy: actor.id })
      .returning({ id: sessionLedger.id });
    await tx.insert(auditLog).values({
      actorId: actor.id,
      action: 'session.extra_granted',
      entity: 'session_ledger',
      entityId: entry.id,
    });
    return { id: e.id, email: e.email, entryId: entry.id };
  });
  if (!employee) return { error: 'invalid' };
  await sendEmail({
    template: 'extra-session',
    userId: employee.id,
    to: employee.email,
    idempotencyKey: `extra-${employee.entryId}`,
  }).catch(() => console.error('email failure: extra-session', employee.id));
  revalidatePath('/psychologist/organization');
  return { success: true };
}
