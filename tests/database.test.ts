import 'dotenv/config';
import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  organizations,
  users,
  availabilityRules,
  appointments,
  sessionLedger,
  auditLog,
  consents,
  type User,
} from '@/lib/db/schema';
import { createBooking } from '@/lib/booking/service';
import { cancelEmployeeBooking } from '@/lib/booking/cancel';
import { getRemaining } from '@/lib/booking/allowance';
import { reconcileAttendance } from '@/lib/jobs/attendance';
import { hrSnapshot } from '@/lib/hr/queries';
import { takeRateLimit } from '@/lib/auth/rate-limit';
import { ensureVideoRoom } from '@/lib/video/whereby';
import { participantExternalId, participantMetadata } from '@/lib/video/signature';
import { POST as wherebyWebhook } from '@/app/api/webhooks/whereby/route';
import { sendDueReminders } from '@/lib/jobs/reminders';
import * as emailService from '@/lib/email/send';
const testUrl = process.env.TEST_DATABASE_URL;
const enabled = !!testUrl;
describe.runIf(enabled)('Postgres transaction and privacy integration', () => {
  let organizationId: string, psychologistId: string;
  const now = new Date('2026-11-06T10:00:00Z');
  const start = (hour: number, day = 9) => new Date(Date.UTC(2026, 10, day, hour));
  async function employee(): Promise<User> {
    return (
      await db()
        .insert(users)
        .values({
          organizationId,
          email: `${crypto.randomUUID()}@example.com`,
          fullName: 'Integration Employee',
          role: 'employee',
          status: 'active',
        })
        .returning()
    )[0];
  }
  beforeAll(async () => {
    const url = new URL(testUrl!);
    if (
      !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      !url.pathname.endsWith('_test')
    )
      throw new Error('Integration tests require a loopback database named *_test');
    process.env.DATABASE_URL = testUrl;
    process.env.AUTH_SECRET = 'local-integration-key';
    const connection = postgres(testUrl!, { max: 1, onnotice: () => {} });
    await migrate(drizzle(connection), { migrationsFolder: 'src/lib/db/migrations' });
    await connection.end();
    organizationId = (
      await db()
        .insert(organizations)
        .values({
          name: 'Integration Org',
          hrContactName: 'Test Contact',
          hrContactEmail: `${crypto.randomUUID()}@example.com`,
        })
        .returning()
    )[0].id;
    await db().update(users).set({ status: 'deactivated' }).where(eq(users.role, 'psychologist'));
    psychologistId = (
      await db()
        .insert(users)
        .values({
          email: `${crypto.randomUUID()}@example.com`,
          fullName: 'Integration Clinician',
          role: 'psychologist',
          status: 'active',
          isAdmin: true,
        })
        .returning()
    )[0].id;
    await db()
      .delete(availabilityRules)
      .where(eq(availabilityRules.psychologistId, psychologistId));
    await db()
      .insert(availabilityRules)
      .values(
        [1, 2, 3, 4, 5].map((weekday) => ({
          psychologistId,
          weekday,
          startTime: '07:00',
          endTime: '22:00',
        })),
      );
  });
  afterAll(async () => {
    if (enabled) await db().$client.end();
  });
  it('serializes two bookings against one employee allowance', async () => {
    const e = await employee();
    const result = await Promise.allSettled([
      createBooking(e, start(8), true, now),
      createBooking(e, start(10), true, now),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(await getRemaining(e.id)).toBe(0);
    const rows = await db().select().from(sessionLedger).where(eq(sessionLedger.employeeId, e.id));
    expect(rows.filter((r) => r.reason === 'booking')).toHaveLength(1);
    expect(await db().select().from(consents).where(eq(consents.userId, e.id))).toHaveLength(1);
  });
  it('serializes two employees competing for the same time', async () => {
    const a = await employee(),
      b = await employee();
    const result = await Promise.allSettled([
      createBooking(a, start(12), true, now),
      createBooking(b, start(12), true, now),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await getRemaining(a.id)) + (await getRemaining(b.id))).toBe(1);
  });
  it('Postgres itself rejects overlapping 50-minute intervals', async () => {
    const e = await employee(),
      a = await employee();
    await db()
      .insert(appointments)
      .values({
        employeeId: e.id,
        psychologistId,
        organizationId,
        startsAt: start(14),
        endsAt: new Date(+start(14) + 3000000),
      });
    await expect(
      db()
        .insert(appointments)
        .values({
          employeeId: a.id,
          psychologistId,
          organizationId,
          startsAt: new Date(+start(14) + 1800000),
          endsAt: new Date(+start(14) + 4800000),
        }),
    ).rejects.toThrow();
  });
  it('refunds a free cancellation only once', async () => {
    const e = await employee();
    const result = await createBooking(e, start(16), true, now);
    await cancelEmployeeBooking(e, result.appointment.id, now);
    await expect(cancelEmployeeBooking(e, result.appointment.id, now)).rejects.toThrow();
    expect(await getRemaining(e.id)).toBe(1);
    expect(
      await db()
        .select()
        .from(sessionLedger)
        .where(
          and(
            eq(sessionLedger.appointmentId, result.appointment.id),
            eq(sessionLedger.reason, 'refund'),
          ),
        ),
    ).toHaveLength(1);
  });
  it('keeps a late cancellation pending without an automatic refund', async () => {
    const e = await employee();
    const result = await createBooking(e, start(18), true, now);
    await cancelEmployeeBooking(e, result.appointment.id, new Date(+start(18) - 3600000));
    const [a] = await db()
      .select()
      .from(appointments)
      .where(eq(appointments.id, result.appointment.id));
    expect(a.status).toBe('late_cancelled');
    expect(a.outcome).toBe('pending');
    expect(await getRemaining(e.id)).toBe(0);
  });
  it('refunds a psychologist no-show idempotently', async () => {
    const e = await employee();
    const result = await createBooking(e, start(8, 10), true, now);
    await db()
      .update(appointments)
      .set({ employeeJoinedAt: start(8, 10) })
      .where(eq(appointments.id, result.appointment.id));
    await reconcileAttendance(new Date(+start(8, 10) + 3600000));
    await reconcileAttendance(new Date(+start(8, 10) + 3600000));
    expect(await getRemaining(e.id)).toBe(1);
    expect(
      await db()
        .select()
        .from(sessionLedger)
        .where(
          and(
            eq(sessionLedger.appointmentId, result.appointment.id),
            eq(sessionLedger.reason, 'refund'),
          ),
        ),
    ).toHaveLength(1);
  });
  it('keeps HR responses free of appointment and allowance details', async () => {
    const snapshot = await hrSnapshot(organizationId);
    expect(snapshot.used).toBeNull();
    for (const e of snapshot.employees)
      expect(Object.keys(e).sort()).toEqual(['email', 'fullName', 'id', 'invitedAt', 'status']);
    expect(Object.keys(snapshot).sort()).toEqual(['accounts', 'employees', 'organization', 'used']);
  });
  it('prevents an appointment from using another organization', async () => {
    const e = await employee();
    const [other] = await db()
      .insert(organizations)
      .values({
        name: 'Other Test Org',
        hrContactName: 'Other Contact',
        hrContactEmail: `${crypto.randomUUID()}@example.com`,
      })
      .returning();
    await expect(
      db()
        .insert(appointments)
        .values({
          employeeId: e.id,
          psychologistId,
          organizationId: other.id,
          startsAt: start(12, 11),
          endsAt: new Date(+start(12, 11) + 3000000),
        }),
    ).rejects.toThrow();
  });
  it('enforces append-only audit rows', async () => {
    const [audit] = await db()
      .insert(auditLog)
      .values({
        actorId: null,
        action: 'test.audit',
        entity: 'organizations',
        entityId: organizationId,
      })
      .returning();
    await expect(
      db().update(auditLog).set({ action: 'modified' }).where(eq(auditLog.id, audit.id)),
    ).rejects.toThrow();
    await expect(db().delete(auditLog).where(eq(auditLog.id, audit.id))).rejects.toThrow();
  });
  it('creates one encrypted room and separates host and employee URLs', async () => {
    const e = await employee();
    const [psychologist] = await db().select().from(users).where(eq(users.id, psychologistId));
    const startsAt = new Date(Date.now() + 5 * 60000);
    const [a] = await db()
      .insert(appointments)
      .values({
        employeeId: e.id,
        psychologistId,
        organizationId,
        startsAt,
        endsAt: new Date(+startsAt + 3000000),
      })
      .returning();
    const previous = process.env.WHEREBY_API_KEY;
    process.env.WHEREBY_API_KEY = 'local-test-key';
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            meetingId: crypto.randomUUID(),
            roomUrl: 'https://qa.whereby.com/room',
            hostRoomUrl: 'https://qa.whereby.com/room?roomKey=test-host-secret',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);
    try {
      const [visitor, host] = await Promise.all([
        ensureVideoRoom(a.id, e),
        ensureVideoRoom(a.id, psychologist),
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(visitor).not.toContain('test-host-secret');
      expect(host).toContain('test-host-secret');
      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.recording.type).toBe('none');
      expect(body.liveTranscription.startTrigger).toBe('none');
      const [stored] = await db().select().from(appointments).where(eq(appointments.id, a.id));
      expect(stored.wherebyHostUrlEnc).toMatch(/^v1\./);
      expect(stored.wherebyHostUrlEnc).not.toContain('test-host-secret');
    } finally {
      vi.unstubAllGlobals();
      if (previous === undefined) delete process.env.WHEREBY_API_KEY;
      else process.env.WHEREBY_API_KEY = previous;
    }
  });
  it('authenticates real webhook handling and records both joins idempotently', async () => {
    const e = await employee();
    const result = await createBooking(e, start(15, 11), true, now);
    const meetingId = crypto.randomUUID();
    await db()
      .update(appointments)
      .set({ wherebyMeetingId: meetingId })
      .where(eq(appointments.id, result.appointment.id));
    process.env.WHEREBY_WEBHOOK_SECRET = 'local-webhook-secret';
    const deliver = async (role: 'employee' | 'psychologist', valid = true) => {
      const body = JSON.stringify({
        id: crypto.randomUUID(),
        type: 'room.client.joined',
        createdAt: start(15, 11).toISOString(),
        data: {
          meetingId,
          externalId: participantExternalId(result.appointment.id, role),
          metadata: participantMetadata(result.appointment.id, role),
          roleName: role === 'employee' ? 'visitor' : 'host',
        },
      });
      const time = String(Math.floor(Date.now() / 1000));
      const signature = createHmac('sha256', process.env.WHEREBY_WEBHOOK_SECRET!)
        .update(`${time}.${body}`)
        .digest('hex');
      return wherebyWebhook(
        new Request('http://localhost/api/webhooks/whereby', {
          method: 'POST',
          body,
          headers: { 'Whereby-Signature': `t=${time},v1=${valid ? signature : '0'.repeat(64)}` },
        }),
      );
    };
    expect((await deliver('employee', false)).status).toBe(401);
    expect((await deliver('employee')).status).toBe(200);
    await deliver('employee');
    await deliver('psychologist');
    const [a] = await db()
      .select()
      .from(appointments)
      .where(eq(appointments.id, result.appointment.id));
    expect(a.employeeJoinedAt).not.toBeNull();
    expect(a.psychologistJoinedAt).not.toBeNull();
    await reconcileAttendance(new Date(+a.endsAt + 1));
    const [settled] = await db().select().from(appointments).where(eq(appointments.id, a.id));
    expect(settled.status).toBe('completed');
  });
  it('sends each due reminder once to both parties', async () => {
    const e = await employee();
    const result = await createBooking(e, start(12, 12), true, now);
    const mock = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
    try {
      await sendDueReminders(new Date(+result.appointment.startsAt - 24 * 3600000));
      await sendDueReminders(new Date(+result.appointment.startsAt - 24 * 3600000));
      await sendDueReminders(new Date(+result.appointment.startsAt - 15 * 60000));
      await sendDueReminders(new Date(+result.appointment.startsAt - 15 * 60000));
      const calls = mock.mock.calls.filter(([input]) =>
        input.idempotencyKey?.includes(result.appointment.id),
      );
      expect(calls).toHaveLength(4);
      expect(calls.filter(([input]) => input.template === 'reminder-24h')).toHaveLength(2);
      expect(calls.filter(([input]) => input.template === 'reminder-15m')).toHaveLength(2);
    } finally {
      mock.mockRestore();
    }
  });
  it('atomically permits only five concurrent urgent attempts', async () => {
    const id = crypto.randomUUID();
    const results = await Promise.all(
      Array.from({ length: 12 }, () => takeRateLimit('test-urgent', id, 5, 3600000)),
    );
    expect(results.filter(Boolean)).toHaveLength(5);
    const [row] = await db()
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLog);
    expect(row.count).toBeGreaterThan(0);
  });
});
