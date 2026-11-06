import { authorizedCron } from '@/lib/jobs/auth';
import { reconcileAttendance } from '@/lib/jobs/attendance';
import { demoEnabled } from '@/demo/config'; // DEMO: remove before production
export const maxDuration = 60;
export async function GET(request: Request) {
  if (!authorizedCron(request)) return new Response(null, { status: 401 });
  if (demoEnabled()) return Response.json({ ok: true, skipped: true }); // DEMO: remove before production
  await reconcileAttendance();
  return Response.json({ ok: true });
}
