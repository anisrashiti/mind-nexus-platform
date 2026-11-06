import 'server-only';
import { and, eq, desc, isNull, gt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { urgentMessages, users, organizations, appointments, auditLog } from '@/lib/db/schema';
import { decrypt } from '@/lib/crypto';
export async function urgentSummary(actorId: string) {
  const [message] = await db()
    .select({
      id: urgentMessages.id,
      name: users.fullName,
      bodyEnc: urgentMessages.bodyEnc,
      createdAt: urgentMessages.createdAt,
    })
    .from(urgentMessages)
    .innerJoin(users, eq(users.id, urgentMessages.employeeId))
    .where(isNull(urgentMessages.handledAt))
    .orderBy(desc(urgentMessages.createdAt))
    .limit(1);
  if (!message) return null;
  await db().insert(auditLog).values({
    actorId,
    action: 'urgent.preview_viewed',
    entity: 'urgent_messages',
    entityId: message.id,
  });
  return {
    id: message.id,
    name: message.name,
    preview: decrypt(message.bodyEnc).slice(0, 100),
    createdAt: message.createdAt,
  };
}
export async function urgentInbox(actorId: string, selectedId?: string) {
  const rows = await db()
    .select({
      id: urgentMessages.id,
      employeeId: urgentMessages.employeeId,
      name: users.fullName,
      email: users.email,
      organization: organizations.name,
      bodyEnc: urgentMessages.bodyEnc,
      phoneEnc: urgentMessages.phoneEnc,
      createdAt: urgentMessages.createdAt,
      handledAt: urgentMessages.handledAt,
    })
    .from(urgentMessages)
    .innerJoin(users, eq(users.id, urgentMessages.employeeId))
    .innerJoin(organizations, eq(organizations.id, users.organizationId))
    .orderBy(desc(urgentMessages.createdAt));
  if (rows.length)
    await db()
      .insert(auditLog)
      .values(
        rows.map((row) => ({
          actorId,
          action: 'urgent.preview_viewed',
          entity: 'urgent_messages',
          entityId: row.id,
        })),
      );
  const selected = rows.find((row) => row.id === selectedId);
  let detail = null;
  if (selected) {
    await db().transaction(async (tx) => {
      await tx
        .update(urgentMessages)
        .set({ readAt: new Date() })
        .where(and(eq(urgentMessages.id, selected.id), isNull(urgentMessages.readAt)));
      await tx.insert(auditLog).values({
        actorId,
        action: 'urgent.viewed',
        entity: 'urgent_messages',
        entityId: selected.id,
      });
    });
    const [next] = await db()
      .select({ startsAt: appointments.startsAt })
      .from(appointments)
      .where(
        and(
          eq(appointments.employeeId, selected.employeeId),
          eq(appointments.status, 'confirmed'),
          gt(appointments.endsAt, new Date()),
        ),
      )
      .orderBy(appointments.startsAt)
      .limit(1);
    detail = {
      id: selected.id,
      name: selected.name,
      email: selected.email,
      organization: selected.organization,
      body: decrypt(selected.bodyEnc),
      phone: selected.phoneEnc ? decrypt(selected.phoneEnc) : null,
      createdAt: selected.createdAt,
      handled: !!selected.handledAt,
      next: next?.startsAt ?? null,
    };
  }
  return {
    messages: rows.map((row) => ({
      id: row.id,
      name: row.name,
      preview: decrypt(row.bodyEnc).slice(0, 70),
      createdAt: row.createdAt,
      handled: !!row.handledAt,
    })),
    detail,
  };
}
