import 'server-only';
import { and, eq, gte, lte, inArray } from 'drizzle-orm';
import { db, type Transaction } from '@/lib/db/client';
import { availabilityRules, timeOff, appointments } from '@/lib/db/schema';
import { localDate, localInstant, nextDate } from '@/lib/dates';
import { BLOCKING_STATUSES } from '@/lib/constants';
import { generateSlots } from './slot-engine';
export async function getAvailableSlots(
  psychologistId: string,
  fromDate: Date | string,
  toDate: Date | string,
  now = new Date(),
  transaction?: Transaction,
) {
  const from = typeof fromDate === 'string' ? fromDate : localDate(fromDate),
    to = typeof toDate === 'string' ? toDate : localDate(toDate);
  const database = transaction ?? db();
  const start = localInstant(from),
    end = localInstant(nextDate(to));
  const [rules, off, busy] = await Promise.all([
    database
      .select({
        weekday: availabilityRules.weekday,
        startTime: availabilityRules.startTime,
        endTime: availabilityRules.endTime,
      })
      .from(availabilityRules)
      .where(eq(availabilityRules.psychologistId, psychologistId)),
    database
      .select({ startsAt: timeOff.startsAt, endsAt: timeOff.endsAt })
      .from(timeOff)
      .where(
        and(
          eq(timeOff.psychologistId, psychologistId),
          lte(timeOff.startsAt, end),
          gte(timeOff.endsAt, start),
        ),
      ),
    database
      .select({
        startsAt: appointments.startsAt,
        endsAt: appointments.endsAt,
        status: appointments.status,
      })
      .from(appointments)
      .where(
        and(
          eq(appointments.psychologistId, psychologistId),
          inArray(appointments.status, [...BLOCKING_STATUSES]),
          lte(appointments.startsAt, end),
          gte(appointments.endsAt, start),
        ),
      ),
  ]);
  return generateSlots({
    rules,
    timeOff: off,
    appointments: busy,
    fromDate: from,
    toDate: to,
    now,
  });
}
