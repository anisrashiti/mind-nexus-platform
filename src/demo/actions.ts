'use server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { sessions } from '@/lib/db/schema';
import { hashToken, newToken } from '@/lib/crypto';
import { takeRateLimit } from '@/lib/auth/rate-limit';
import { roleHome } from '@/lib/auth/guards';
import { requireDemoAccess, requireDemoMode } from './access';
import {
  correctDemoCode,
  createDemoAccessToken,
  DEMO_ACCESS_SECONDS,
  demoAccessCookieName,
  demoCookieSecure,
  demoSessionCookieName,
} from './access-token';
import { DEMO_VIEW_KEYS } from './config';
import { demoSignInUser, seedDemoData } from './seed';

export type DemoState = { error?: 'incorrectCode' | 'unavailable' | 'rateLimited' };
async function limited(scope: string, limit: number, windowMs: number) {
  const h = await headers();
  const ip = (h.get('x-vercel-forwarded-for') ?? h.get('x-forwarded-for') ?? 'unknown')
    .split(',')[0]
    .trim();
  return takeRateLimit(`demo-${scope}`, ip, limit, windowMs);
}
export async function unlockDemo(_: DemoState, form: FormData): Promise<DemoState> {
  requireDemoMode();
  const code = z.string().min(1).max(256).safeParse(form.get('code'));
  if (!(await limited('access', 10, 15 * 60000))) return { error: 'rateLimited' };
  if (!code.success || !correctDemoCode(code.data)) return { error: 'incorrectCode' };
  (await cookies()).set(demoAccessCookieName(), createDemoAccessToken(), {
    httpOnly: true,
    secure: demoCookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: DEMO_ACCESS_SECONDS,
  });
  redirect('/demo');
}
export async function enterDemo(_: DemoState, form: FormData): Promise<DemoState> {
  await requireDemoAccess();
  const view = z
    .enum(DEMO_VIEW_KEYS as [(typeof DEMO_VIEW_KEYS)[number], ...(typeof DEMO_VIEW_KEYS)[number][]])
    .safeParse(form.get('view'));
  if (!view.success) return { error: 'unavailable' };
  if (!(await limited('sign-in', 60, 15 * 60000))) return { error: 'rateLimited' };
  let home: string;
  try {
    const user = await demoSignInUser(view.data);
    const raw = newToken();
    const cookieStore = await cookies();
    const old = cookieStore.get(demoSessionCookieName())?.value;
    if (old && /^[a-f0-9]{64}$/.test(old)) {
      const { eq } = await import('drizzle-orm');
      await db()
        .delete(sessions)
        .where(eq(sessions.sessionToken, hashToken(old)));
    }
    await db()
      .insert(sessions)
      .values({
        sessionToken: hashToken(raw),
        userId: user.id,
        expires: new Date(Date.now() + DEMO_ACCESS_SECONDS * 1000),
      });
    cookieStore.set(demoSessionCookieName(), raw, {
      httpOnly: true,
      secure: demoCookieSecure(),
      sameSite: 'lax',
      path: '/',
      maxAge: DEMO_ACCESS_SECONDS,
    });
    home = roleHome(user.role);
  } catch {
    return { error: 'unavailable' };
  }
  redirect(home);
}
export async function resetDemo(_: DemoState, form: FormData): Promise<DemoState> {
  await requireDemoAccess();
  if (!z.literal('reset').safeParse(form.get('intent')).success) return { error: 'unavailable' };
  if (!(await limited('reset', 10, 3600000))) return { error: 'rateLimited' };
  try {
    await seedDemoData();
    (await cookies()).delete(demoSessionCookieName());
    revalidatePath('/', 'layout');
  } catch {
    return { error: 'unavailable' };
  }
  redirect('/demo');
}
