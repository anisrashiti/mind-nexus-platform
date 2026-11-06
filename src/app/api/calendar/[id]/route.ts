import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireEmployee } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { appointments } from '@/lib/db/schema';
import { calendarFile } from '@/lib/booking/calendar';
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireEmployee();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404 });
  const [appointment] = await db()
    .select({ id: appointments.id, startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(
      and(
        eq(appointments.id, id),
        eq(appointments.employeeId, user.id),
        eq(appointments.organizationId, user.organizationId!),
      ),
    );
  if (!appointment) return new Response(null, { status: 404 });
  return new Response(calendarFile(appointment), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="session.ics"',
      'Cache-Control': 'private, no-store',
    },
  });
}
