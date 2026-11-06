import { and, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { appointments } from '@/lib/db/schema';
import {
  validWherebySignature,
  verifyParticipantMetadata,
  participantExternalId,
} from '@/lib/video/signature';
const eventSchema = z.object({
  id: z.string(),
  type: z.string(),
  createdAt: z.iso.datetime(),
  data: z.object({
    meetingId: z.union([z.string(), z.number()]),
    externalId: z.string().optional(),
    metadata: z.string().optional(),
    roleName: z.string().optional(),
  }),
});
export async function POST(request: Request) {
  const secret = process.env.WHEREBY_WEBHOOK_SECRET;
  if (!secret) return new Response(null, { status: 503 });
  if (Number(request.headers.get('content-length') ?? 0) > 64000)
    return new Response(null, { status: 413 });
  const raw = await request.text();
  if (raw.length > 64000) return new Response(null, { status: 413 });
  if (!validWherebySignature(raw, request.headers.get('Whereby-Signature'), secret))
    return new Response(null, { status: 401 });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) return new Response(null, { status: 400 });
  const event = parsed.data;
  if (event.type !== 'room.client.joined') return new Response(null, { status: 200 });
  const [a] = await db()
    .select({ id: appointments.id, startsAt: appointments.startsAt, endsAt: appointments.endsAt })
    .from(appointments)
    .where(eq(appointments.wherebyMeetingId, String(event.data.meetingId)))
    .limit(1);
  if (!a) return new Response(null, { status: 200 });
  const role =
    event.data.externalId === participantExternalId(a.id, 'employee')
      ? 'employee'
      : event.data.externalId === participantExternalId(a.id, 'psychologist')
        ? 'psychologist'
        : null;
  const joined = new Date(event.createdAt);
  if (
    !role ||
    !event.data.metadata ||
    !verifyParticipantMetadata(event.data.metadata, a.id, role) ||
    +joined < +a.startsAt - 10 * 60000 ||
    joined >= a.endsAt ||
    (role === 'psychologist' && event.data.roleName !== 'host') ||
    (role === 'employee' && !['visitor', 'granted_visitor'].includes(event.data.roleName ?? ''))
  )
    return new Response(null, { status: 200 });
  const column =
    role === 'employee' ? appointments.employeeJoinedAt : appointments.psychologistJoinedAt;
  await db()
    .update(appointments)
    .set({
      [role === 'employee' ? 'employeeJoinedAt' : 'psychologistJoinedAt']:
        sql`least(coalesce(${column},${joined.toISOString()}::timestamptz),${joined.toISOString()}::timestamptz)`,
    })
    .where(
      and(
        eq(appointments.id, a.id),
        eq(appointments.wherebyMeetingId, String(event.data.meetingId)),
      ),
    );
  return new Response(null, { status: 200 });
}
