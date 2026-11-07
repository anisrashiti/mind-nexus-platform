'use server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { hash, argon2id } from 'argon2';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { signIn, signOut } from './config';
import { redirectAuthenticated } from './guards';
import { passwordSchema, emailSchema, tokenSchema } from './password';
import { takeRateLimit } from './rate-limit';
import { clientIp } from './access';
import { db } from '@/lib/db/client';
import { users, invites, passwordResets, sessions, organizations } from '@/lib/db/schema';
import { newToken, hashToken } from '@/lib/crypto';
import { sendEmail } from '@/lib/email/send';
import { placeholders } from '@/content/placeholders';
export type AuthState = { error?: string; success?: boolean };
export async function loginAction(_: AuthState, form: FormData): Promise<AuthState> {
  await redirectAuthenticated();
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) return { error: 'unconfigured' };
  const parsed = z
    .object({ email: emailSchema, password: z.string().min(1).max(128) })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'loginError' };
  try {
    await signIn('credentials', { ...parsed.data, redirectTo: '/' });
  } catch (error) {
    if (error instanceof AuthError) return { error: 'loginError' };
    throw error;
  }
  return {};
}
export async function logoutAction() {
  await signOut({ redirectTo: '/login' });
}
export async function forgotAction(_: AuthState, form: FormData): Promise<AuthState> {
  await redirectAuthenticated();
  const parsed = emailSchema.safeParse(form.get('email'));
  if (!parsed.success) return { error: 'invalid' };
  if (!process.env.DATABASE_URL || !process.env.AUTH_SECRET) return { success: true };
  const h = await headers();
  const ip = clientIp(h);
  if (
    !(await takeRateLimit('reset-ip', ip, 50, 3600000)) ||
    !(await takeRateLimit('reset-email', parsed.data, 5, 3600000))
  )
    return { success: true };
  const user = (
    await db()
      .select()
      .from(users)
      .where(and(eq(users.email, parsed.data), eq(users.status, 'active')))
      .limit(1)
  )[0];
  if (user) {
    const token = newToken();
    await db()
      .insert(passwordResets)
      .values({
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 30 * 60000),
      });
    await sendEmail({
      template: 'password-reset',
      userId: user.id,
      to: user.email,
      href: `${process.env.APP_URL}/reset/${token}`,
    }).catch(() => console.error('email failure: password-reset', user.id));
  }
  return { success: true };
}
export async function acceptInviteAction(_: AuthState, form: FormData): Promise<AuthState> {
  await redirectAuthenticated();
  const parsed = z
    .object({
      token: tokenSchema,
      fullName: z.string().trim().min(2).max(120),
      password: passwordSchema,
      terms: z.literal('on'),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'invalid' };
  if (process.env.NODE_ENV === 'production' && !placeholders.legalApproved)
    return { error: 'legalPending' };
  const passwordHash = await hash(parsed.data.password, { type: argon2id });
  const accepted = await db().transaction(async (tx) => {
    const [candidate] = await tx
      .select({ email: invites.email, organizationId: invites.organizationId })
      .from(invites)
      .where(eq(invites.tokenHash, hashToken(parsed.data.token)))
      .limit(1);
    if (!candidate) return false;
    // Keep the same user-first lock order as resend/deactivation; recheck the token after the lock.
    const [employee] = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, candidate.email),
          eq(users.organizationId, candidate.organizationId),
          eq(users.role, 'employee'),
          eq(users.status, 'invited'),
        ),
      )
      .for('update')
      .limit(1);
    if (!employee) return false;
    const invite = (
      await tx
        .select()
        .from(invites)
        .where(
          and(
            eq(invites.tokenHash, hashToken(parsed.data.token)),
            gt(invites.expiresAt, new Date()),
            isNull(invites.acceptedAt),
          ),
        )
        .for('update')
        .limit(1)
    )[0];
    if (!invite) return false;
    const org = (
      await tx
        .select()
        .from(organizations)
        .where(eq(organizations.id, invite.organizationId))
        .limit(1)
    )[0];
    if (org?.status !== 'active') return false;
    const rows = await tx
      .update(users)
      .set({
        fullName: parsed.data.fullName,
        passwordHash,
        status: 'active',
        activatedAt: new Date(),
      })
      .where(
        and(
          eq(users.email, invite.email),
          eq(users.organizationId, invite.organizationId),
          eq(users.role, 'employee'),
          eq(users.status, 'invited'),
        ),
      )
      .returning({ id: users.id });
    if (!rows.length) return false;
    await tx
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(
        and(
          eq(invites.email, invite.email),
          eq(invites.organizationId, invite.organizationId),
          isNull(invites.acceptedAt),
        ),
      );
    return true;
  });
  if (!accepted) return { error: 'expired' };
  redirect('/login');
}
export async function resetPasswordAction(_: AuthState, form: FormData): Promise<AuthState> {
  await redirectAuthenticated();
  const parsed = z
    .object({ token: tokenSchema, password: passwordSchema })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: 'invalid' };
  const passwordHash = await hash(parsed.data.password, { type: argon2id });
  const reset = await db().transaction(async (tx) => {
    const [candidate] = await tx
      .select({ userId: passwordResets.userId })
      .from(passwordResets)
      .where(eq(passwordResets.tokenHash, hashToken(parsed.data.token)))
      .limit(1);
    if (!candidate) return false;
    await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, candidate.userId))
      .for('update');
    const token = (
      await tx
        .select()
        .from(passwordResets)
        .where(
          and(
            eq(passwordResets.tokenHash, hashToken(parsed.data.token)),
            gt(passwordResets.expiresAt, new Date()),
            isNull(passwordResets.usedAt),
          ),
        )
        .for('update')
        .limit(1)
    )[0];
    if (!token) return false;
    const user = (
      await tx.select().from(users).where(eq(users.id, token.userId)).for('update').limit(1)
    )[0];
    if (user?.status !== 'active') return false;
    await tx.update(users).set({ passwordHash }).where(eq(users.id, user.id));
    await tx
      .update(passwordResets)
      .set({ usedAt: new Date() })
      .where(and(eq(passwordResets.userId, user.id), isNull(passwordResets.usedAt)));
    await tx.delete(sessions).where(eq(sessions.userId, user.id));
    return true;
  });
  return reset ? { success: true } : { error: 'expired' };
}
