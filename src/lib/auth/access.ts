import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { organizations, type User } from '@/lib/db/schema';
/** First address in the proxy chain; Vercel's header cannot be spoofed by the client. */
export function clientIp(headers: Headers) {
  return (headers.get('x-vercel-forwarded-for') ?? headers.get('x-forwarded-for') ?? 'unknown')
    .split(',')[0]
    .trim();
}
/** Active user whose organization (if any) is still active. */
export async function hasAccess(user: Pick<User, 'status' | 'role' | 'organizationId'>) {
  if (user.status !== 'active') return false;
  if (user.role === 'psychologist') return true;
  if (!user.organizationId) return false;
  const [org] = await db()
    .select({ status: organizations.status })
    .from(organizations)
    .where(eq(organizations.id, user.organizationId))
    .limit(1);
  return org?.status === 'active';
}
