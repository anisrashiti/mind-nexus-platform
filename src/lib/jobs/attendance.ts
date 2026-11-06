import 'server-only';
import { and, eq, lt, or, isNotNull } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { appointments, users, auditLog, type Appointment } from '@/lib/db/schema';
import { refundOnce } from '@/lib/booking/settle';
import { notifyCancelled } from '@/lib/booking/notifications';
import { closeVideoRoom } from '@/lib/video/whereby';
export async function reconcileAttendance(now = new Date()) {
  const candidates = await db()
    .select({ id: appointments.id, employeeId: appointments.employeeId })
    .from(appointments)
    .where(
      and(
        lt(appointments.startsAt, new Date(+now - 15 * 60000)),
        or(
          eq(appointments.status, 'confirmed'),
          and(eq(appointments.status, 'no_show'), eq(appointments.outcome, 'pending')),
        ),
      ),
    )
    .limit(100);
  for (const candidate of candidates) {
    const refund = await db().transaction(async (tx) => {
      await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, candidate.employeeId))
        .for('update');
      const [a] = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, candidate.id))
        .for('update');
      if (
        !a ||
        !['confirmed', 'no_show'].includes(a.status) ||
        (a.status === 'no_show' && a.outcome !== 'pending')
      )
        return null;
      let status: Appointment['status'] = a.status,
        outcome: Appointment['outcome'] = a.outcome;
      let refund = false;
      if (a.endsAt <= now) {
        if (a.employeeJoinedAt && a.psychologistJoinedAt) {
          status = 'completed';
          outcome = 'none';
        } else if (a.employeeJoinedAt) {
          status = 'cancelled_by_psychologist';
          outcome = 'none';
          refund = true;
        } else {
          status = 'no_show';
          outcome = 'pending';
        }
      } else if (!a.employeeJoinedAt && +a.startsAt + 15 * 60000 <= +now) {
        status = 'no_show';
        outcome = 'pending';
      }
      if (status === a.status && outcome === a.outcome) return null;
      await tx.update(appointments).set({ status, outcome }).where(eq(appointments.id, a.id));
      if (refund) await refundOnce(tx, a, null);
      await tx.insert(auditLog).values({
        actorId: null,
        action: `appointment.${status}`,
        entity: 'appointments',
        entityId: a.id,
      });
      return refund ? a : null;
    });
    if (refund)
      await notifyCancelled(refund, false, true).catch(() =>
        console.error('email failure: cancelled', refund.id),
      );
  }
  const endedRooms = await db()
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        isNotNull(appointments.wherebyRoomUrlEnc),
        or(
          lt(appointments.endsAt, now),
          eq(appointments.status, 'cancelled'),
          eq(appointments.status, 'cancelled_by_psychologist'),
          eq(appointments.status, 'late_cancelled'),
        ),
      ),
    )
    .limit(100);
  for (const room of endedRooms)
    await closeVideoRoom(room.id).catch(() => console.error('room cleanup failure:', room.id));
}
