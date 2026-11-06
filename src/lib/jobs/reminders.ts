import 'server-only';
import { and, eq, gt, lte, isNull, or } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { appointments, users } from '@/lib/db/schema';
import { sendEmail } from '@/lib/email/send';
import { displayTime } from '@/lib/dates';
export async function sendDueReminders(now = new Date()) {
  const candidates = await db()
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.status, 'confirmed'),
        gt(appointments.startsAt, now),
        lte(appointments.startsAt, new Date(+now + 24 * 3600000)),
        or(isNull(appointments.reminder24hSentAt), isNull(appointments.reminder15mSentAt)),
      ),
    );
  for (const candidate of candidates)
    await db().transaction(async (tx) => {
      const [a] = await tx
        .select()
        .from(appointments)
        .where(eq(appointments.id, candidate.id))
        .for('update');
      if (!a || a.status !== 'confirmed' || a.startsAt <= now) return;
      const usersToEmail = await tx
        .select({ id: users.id, email: users.email })
        .from(users)
        .where(or(eq(users.id, a.employeeId), eq(users.id, a.psychologistId)));
      for (const minutes of [1440, 15] as const) {
        const sent = minutes === 1440 ? a.reminder24hSentAt : a.reminder15mSentAt;
        const due = +a.startsAt - +now <= minutes * 60000;
        if (sent || !due) continue;
        const template = minutes === 1440 ? 'reminder-24h' : 'reminder-15m';
        await Promise.all(
          usersToEmail.map((user) =>
            sendEmail({
              template,
              userId: user.id,
              to: user.email,
              values: { time: displayTime(a.startsAt) },
              idempotencyKey: `${template}-${a.id}-${user.id}`,
            }),
          ),
        );
        await tx
          .update(appointments)
          .set(minutes === 1440 ? { reminder24hSentAt: now } : { reminder15mSentAt: now })
          .where(eq(appointments.id, a.id));
      }
    });
}
