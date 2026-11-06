import { and, eq, gt, isNull } from 'drizzle-orm';
import { AuthForm } from '@/components/auth/auth-form';
import { db } from '@/lib/db/client';
import { passwordResets } from '@/lib/db/schema';
import { hashToken } from '@/lib/crypto';
import { tokenSchema } from '@/lib/auth/password';
import { redirectAuthenticated } from '@/lib/auth/guards';
export default async function Reset({ params }: { params: Promise<{ token: string }> }) {
  await redirectAuthenticated();
  const { token } = await params;
  if (!process.env.DATABASE_URL || !tokenSchema.safeParse(token).success)
    return <AuthForm mode="reset" invalid />;
  const row = (
    await db()
      .select({ id: passwordResets.id })
      .from(passwordResets)
      .where(
        and(
          eq(passwordResets.tokenHash, hashToken(token)),
          gt(passwordResets.expiresAt, new Date()),
          isNull(passwordResets.usedAt),
        ),
      )
      .limit(1)
  )[0];
  return <AuthForm mode="reset" token={token} invalid={!row} />;
}
