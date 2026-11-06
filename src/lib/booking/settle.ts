import 'server-only';
import { and, eq, lte } from 'drizzle-orm';
import type { Transaction } from '@/lib/db/client';
import { appointments, sessionLedger, auditLog, type Appointment } from '@/lib/db/schema';
export async function refundOnce(
  tx: Transaction,
  appointment: Appointment,
  actorId: string | null,
) {
  await tx
    .insert(sessionLedger)
    .values({
      employeeId: appointment.employeeId,
      amount: 1,
      reason: 'refund',
      appointmentId: appointment.id,
      createdBy: actorId,
    })
    .onConflictDoNothing();
}
export async function settleExpired(tx: Transaction, employeeId: string, now: Date) {
  const expired = await tx
    .select()
    .from(appointments)
    .where(
      and(
        eq(appointments.employeeId, employeeId),
        eq(appointments.status, 'confirmed'),
        lte(appointments.endsAt, now),
      ),
    )
    .for('update');
  for (const appointment of expired) {
    let status: Appointment['status'],
      outcome: Appointment['outcome'] = 'none';
    if (appointment.employeeJoinedAt && appointment.psychologistJoinedAt) status = 'completed';
    else if (appointment.employeeJoinedAt) {
      status = 'cancelled_by_psychologist';
      await refundOnce(tx, appointment, null);
    } else {
      status = 'no_show';
      outcome = 'pending';
    }
    await tx
      .update(appointments)
      .set({ status, outcome })
      .where(eq(appointments.id, appointment.id));
    await tx.insert(auditLog).values({
      actorId: null,
      action: `appointment.${status}`,
      entity: 'appointments',
      entityId: appointment.id,
    });
  }
}
