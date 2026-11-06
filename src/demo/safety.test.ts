import { afterEach, expect, it, vi } from 'vitest';
import { sendEmail } from '@/lib/email/send';
import { ensureVideoRoom, closeVideoRoom } from '@/lib/video/whereby';
import { GET as reminders } from '@/app/api/cron/reminders/route';
import { GET as attendance } from '@/app/api/cron/attendance/route';
import type { User } from '@/lib/db/schema';

const jobMocks = vi.hoisted(() => ({ reminders: vi.fn(), attendance: vi.fn() }));
vi.mock('@/lib/jobs/reminders', () => ({ sendDueReminders: jobMocks.reminders }));
vi.mock('@/lib/jobs/attendance', () => ({ reconcileAttendance: jobMocks.attendance }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it('skips real email and video even when live service keys are present', async () => {
  vi.stubEnv('DEMO_MODE', 'true');
  vi.stubEnv('RESEND_API_KEY', 'must-not-be-used');
  vi.stubEnv('WHEREBY_API_KEY', 'must-not-be-used');
  const log = vi.spyOn(console, 'info').mockImplementation(() => {});
  const fetchSpy = vi
    .spyOn(globalThis, 'fetch')
    .mockRejectedValue(new Error('Network must not be called'));
  await sendEmail({
    template: 'urgent-alert',
    userId: 'demo-user-id',
    to: 'sample@example.invalid',
    values: { name: 'sample' },
  });
  expect(log).toHaveBeenCalledExactlyOnceWith('demo: email skipped');
  expect(await ensureVideoRoom('demo-appointment-id', {} as User)).toBeNull();
  await closeVideoRoom('demo-appointment-id');
  expect(fetchSpy).not.toHaveBeenCalled();
});
it('keeps cron authentication and skips both jobs in demo mode', async () => {
  vi.stubEnv('DEMO_MODE', 'true');
  vi.stubEnv('CRON_SECRET', 'test-cron-secret');
  for (const handler of [reminders, attendance]) {
    expect((await handler(new Request('http://localhost/api/cron'))).status).toBe(401);
    const response = await handler(
      new Request('http://localhost/api/cron', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );
    expect(await response.json()).toEqual({ ok: true, skipped: true });
  }
  expect(jobMocks.reminders).not.toHaveBeenCalled();
  expect(jobMocks.attendance).not.toHaveBeenCalled();
});
it('runs the usual jobs when demo mode is disabled', async () => {
  vi.stubEnv('DEMO_MODE', 'false');
  vi.stubEnv('CRON_SECRET', 'test-cron-secret');
  for (const handler of [reminders, attendance])
    await handler(
      new Request('http://localhost/api/cron', {
        headers: { authorization: 'Bearer test-cron-secret' },
      }),
    );
  expect(jobMocks.reminders).toHaveBeenCalledOnce();
  expect(jobMocks.attendance).toHaveBeenCalledOnce();
});
