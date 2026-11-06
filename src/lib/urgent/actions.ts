'use server';
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireEmployee, requirePsychologist } from '@/lib/auth/guards';
import { takeRateLimit } from '@/lib/auth/rate-limit';
import { db } from '@/lib/db/client';
import { users, urgentMessages, auditLog } from '@/lib/db/schema';
import { encrypt } from '@/lib/crypto';
import { sendEmail } from '@/lib/email/send';
import { urgentSchema } from './validation';
export async function sendUrgentMessage(input: unknown) {
  const employee = await requireEmployee();
  const parsed = urgentSchema.safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  if (!(await takeRateLimit('urgent', employee.id, 5, 3600000))) return { error: 'rateLimited' };
  const message = await db().transaction(async (tx) => {
    const [locked] = await tx
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(
        and(
          eq(users.id, employee.id),
          eq(users.role, 'employee'),
          eq(users.organizationId, employee.organizationId!),
          eq(users.status, 'active'),
        ),
      )
      .for('update');
    if (!locked) return null;
    const [message] = await tx
      .insert(urgentMessages)
      .values({
        employeeId: locked.id,
        bodyEnc: encrypt(parsed.data.body),
        phoneEnc: parsed.data.phone ? encrypt(parsed.data.phone) : null,
      })
      .returning({ id: urgentMessages.id });
    return { ...message, name: locked.fullName };
  });
  if (!message) return { error: 'invalid' };
  const [clinician] = await db()
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.role, 'psychologist'), eq(users.status, 'active')))
    .limit(1);
  if (clinician)
    await sendEmail({
      template: 'urgent-alert',
      userId: clinician.id,
      to: process.env.PSYCHOLOGIST_ALERT_EMAIL || clinician.email,
      values: { name: message.name },
      href: `${process.env.APP_URL}/psychologist/urgent?message=${message.id}`,
      idempotencyKey: `urgent-${message.id}`,
    }).catch(() => console.error('email failure: urgent-alert', message.id));
  revalidatePath('/psychologist');
  return { success: true };
}
export async function markUrgentHandled(input: unknown) {
  const actor = await requirePsychologist();
  const parsed = z.object({ id: z.uuid() }).safeParse(input);
  if (!parsed.success) return { error: 'invalid' };
  await db().transaction(async (tx) => {
    const [message] = await tx
      .update(urgentMessages)
      .set({ handledAt: new Date(), handledBy: actor.id })
      .where(and(eq(urgentMessages.id, parsed.data.id), isNull(urgentMessages.handledAt)))
      .returning({ id: urgentMessages.id });
    if (message)
      await tx.insert(auditLog).values({
        actorId: actor.id,
        action: 'urgent.handled',
        entity: 'urgent_messages',
        entityId: message.id,
      });
  });
  revalidatePath('/psychologist/urgent');
  revalidatePath('/psychologist');
  return { success: true };
}
