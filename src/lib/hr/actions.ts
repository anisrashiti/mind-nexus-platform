'use server';
import { and, eq, isNull, gt } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireHr } from '@/lib/auth/guards';
import { db, type Transaction } from '@/lib/db/client';
import {
  users,
  invites,
  organizations,
  appointments,
  sessions,
  auditLog,
  type User,
} from '@/lib/db/schema';
import { newToken, hashToken } from '@/lib/crypto';
import { sendEmail } from '@/lib/email/send';
import { refundOnce } from '@/lib/booking/settle';
import { notifyCancelled } from '@/lib/booking/notifications';
import { parseInviteEmails } from './invites';
import { demoEnabled } from '@/demo/config'; // DEMO: remove before production
async function issueInvite(tx: Transaction, actor: User, employee: { id: string; email: string }) {
  const token = newToken();
  await tx
    .update(invites)
    .set({ expiresAt: new Date() })
    .where(
      and(
        eq(invites.email, employee.email),
        eq(invites.organizationId, actor.organizationId!),
        isNull(invites.acceptedAt),
      ),
    );
  await tx.insert(invites).values({
    email: employee.email,
    organizationId: actor.organizationId!,
    tokenHash: hashToken(token),
    invitedBy: actor.id,
    expiresAt: new Date(Date.now() + 14 * 86400000),
  });
  return { userId: employee.id, email: employee.email, token };
}
export async function inviteEmployees(input: unknown) {
  const actor = await requireHr();
  const parsed = z.object({ emails: z.string().min(1).max(26000) }).safeParse(input);
  if (!parsed.success) return { error: 'invalidEmails' };
  const list = parseInviteEmails(parsed.data.emails);
  if (list.invalid.length || !list.emails.length || list.emails.length > 100)
    return { error: 'invalidEmails' };
  const issued = await db().transaction(async (tx) => {
    const result = [];
    for (const email of list.emails) {
      const [employee] = await tx
        .insert(users)
        .values({
          organizationId: actor.organizationId!,
          email,
          fullName: '',
          role: 'employee',
          isDemo: demoEnabled(), // DEMO: remove before production
          status: 'invited',
          invitedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning({ id: users.id, email: users.email });
      if (employee) result.push(await issueInvite(tx, actor, employee));
    }
    return result;
  });
  const [org] = await db()
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, actor.organizationId!));
  await Promise.all(
    issued.map((invite) =>
      sendEmail({
        template: 'invite',
        userId: invite.userId,
        to: invite.email,
        values: { organization: org.name },
        href: `${process.env.APP_URL}/invite/${invite.token}`,
      }).catch(() => console.error('email failure: invite', invite.userId)),
    ),
  );
  revalidatePath('/hr');
  return { success: true };
}
export async function resendInvite(input: unknown) {
  const actor = await requireHr();
  const parsed = z.object({ employeeId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  const invitation = await db().transaction(async (tx) => {
    const [employee] = await tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(
        and(
          eq(users.id, parsed.data.employeeId),
          eq(users.organizationId, actor.organizationId!),
          eq(users.role, 'employee'),
          eq(users.status, 'invited'),
        ),
      )
      .for('update');
    return employee ? issueInvite(tx, actor, employee) : null;
  });
  if (invitation) {
    const [org] = await db()
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, actor.organizationId!));
    await sendEmail({
      template: 'invite',
      userId: invitation.userId,
      to: invitation.email,
      values: { organization: org.name },
      href: `${process.env.APP_URL}/invite/${invitation.token}`,
    }).catch(() => console.error('email failure: invite', invitation.userId));
  }
  return { success: true };
}
export async function deactivateEmployee(input: unknown) {
  const actor = await requireHr();
  const parsed = z.object({ employeeId: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  const cancelled = await db().transaction(async (tx) => {
    const [employee] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.id, parsed.data.employeeId),
          eq(users.organizationId, actor.organizationId!),
          eq(users.role, 'employee'),
        ),
      )
      .for('update');
    if (!employee) return [];
    await tx.update(users).set({ status: 'deactivated' }).where(eq(users.id, employee.id));
    await tx.delete(sessions).where(eq(sessions.userId, employee.id));
    await tx
      .update(invites)
      .set({ expiresAt: new Date() })
      .where(
        and(
          eq(invites.organizationId, actor.organizationId!),
          eq(
            invites.email,
            (
              await tx.select({ email: users.email }).from(users).where(eq(users.id, employee.id))
            )[0].email,
          ),
          isNull(invites.acceptedAt),
        ),
      );
    const future = await tx
      .select()
      .from(appointments)
      .where(
        and(
          eq(appointments.employeeId, employee.id),
          eq(appointments.organizationId, actor.organizationId!),
          eq(appointments.status, 'confirmed'),
          gt(appointments.startsAt, new Date()),
        ),
      )
      .for('update');
    for (const appointment of future) {
      await tx
        .update(appointments)
        .set({ status: 'cancelled', cancelledAt: new Date(), cancelledBy: actor.id })
        .where(eq(appointments.id, appointment.id));
      await refundOnce(tx, appointment, actor.id);
      await tx.insert(auditLog).values({
        actorId: actor.id,
        action: 'appointment.cancelled_on_deactivation',
        entity: 'appointments',
        entityId: appointment.id,
      });
    }
    return future;
  });
  await Promise.all(
    cancelled.map((a) =>
      notifyCancelled(a, false, true).catch(() => console.error('email failure: cancelled', a.id)),
    ),
  );
  revalidatePath('/hr');
  return { success: true }; // The same response regardless of whether an appointment existed.
}
