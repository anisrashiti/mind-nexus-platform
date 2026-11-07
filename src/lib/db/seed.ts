import { config } from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { hash, argon2id } from 'argon2';
import { placeholders } from '../../content/placeholders';
import en from '../../../messages/en.json';
import * as s from './schema';
config({ path: ['.env.local', '.env'], quiet: true });
async function main() {
  if (
    !process.env.DATABASE_URL ||
    !process.env.SEED_PSYCHOLOGIST_PASSWORD ||
    !process.env.SEED_HR_PASSWORD ||
    !process.env.PSYCHOLOGIST_ALERT_EMAIL
  )
    throw new Error('Seed configuration missing');
  if (
    process.env.SEED_PSYCHOLOGIST_PASSWORD.length < 10 ||
    process.env.SEED_HR_PASSWORD.length < 10
  )
    throw new Error('Seed passwords too short');
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO === '1')
    throw new Error('Demo seeding is development only');
  const connection = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  const database = drizzle(connection);
  try {
    await database.transaction(async (tx) => {
      const existing = await tx.select().from(s.organizations).limit(1);
      const org =
        existing[0] ??
        (
          await tx
            .insert(s.organizations)
            .values({
              name: placeholders.organization.name,
              hrContactName: placeholders.organization.hrName,
              hrContactEmail: placeholders.organization.hrEmail,
            })
            .returning()
        )[0];
      async function user(
        email: string,
        fullName: string,
        role: 'psychologist' | 'hr',
        password: string,
      ) {
        const existing = (
          await tx.select().from(s.users).where(eq(s.users.email, email)).limit(1)
        )[0];
        return (
          existing ??
          (
            await tx
              .insert(s.users)
              .values({
                email,
                fullName,
                role,
                passwordHash: await hash(password, { type: argon2id }),
                organizationId: role === 'hr' ? org.id : null,
                isAdmin: role === 'psychologist',
                status: 'active',
                activatedAt: new Date(),
              })
              .returning()
          )[0]
        );
      }
      const clinician = await user(
        process.env.PSYCHOLOGIST_ALERT_EMAIL!,
        en.profile.name,
        'psychologist',
        process.env.SEED_PSYCHOLOGIST_PASSWORD!,
      );
      await user(
        placeholders.organization.hrEmail,
        placeholders.organization.hrName,
        'hr',
        process.env.SEED_HR_PASSWORD!,
      );
      await tx
        .insert(s.psychologistProfiles)
        .values({
          userId: clinician.id,
          title: en.profile.title,
          languages: ['Albanian'],
          bio: en.profile.bio,
        })
        .onConflictDoNothing();
      if (
        !(
          await tx
            .select()
            .from(s.availabilityRules)
            .where(eq(s.availabilityRules.psychologistId, clinician.id))
        ).length
      )
        await tx.insert(s.availabilityRules).values(
          placeholders.weeklyHours.map(([weekday, startTime, endTime]) => ({
            psychologistId: clinician.id,
            weekday,
            startTime,
            endTime,
          })),
        );
      if (process.env.SEED_DEMO === '1') {
        for (const [index, status] of (['active', 'invited', 'active'] as const).entries()) {
          const email = `demo${index + 1}@example.com`;
          const employee = (
            await tx
              .insert(s.users)
              .values({
                email,
                fullName: `Demo Employee ${index + 1}`,
                organizationId: org.id,
                role: 'employee',
                status,
                invitedAt: new Date(),
                activatedAt: status === 'active' ? new Date() : null,
                passwordHash:
                  status === 'active'
                    ? await hash(process.env.SEED_HR_PASSWORD!, { type: argon2id })
                    : null,
              })
              .onConflictDoNothing()
              .returning()
          )[0];
          if (employee && index === 2) {
            const startsAt = new Date(Date.now() - 7 * 86400000);
            startsAt.setUTCMinutes(0, 0, 0);
            const a = (
              await tx
                .insert(s.appointments)
                .values({
                  employeeId: employee.id,
                  psychologistId: clinician.id,
                  organizationId: org.id,
                  startsAt,
                  endsAt: new Date(+startsAt + 50 * 60000),
                  status: 'completed',
                  employeeJoinedAt: startsAt,
                  psychologistJoinedAt: startsAt,
                })
                .returning()
            )[0];
            await tx.insert(s.sessionLedger).values({
              employeeId: employee.id,
              amount: -1,
              reason: 'booking',
              appointmentId: a.id,
            });
          }
        }
      }
    });
    console.info('Seed complete');
  } finally {
    await connection.end();
  }
}
main().catch(() => {
  console.error('Seed failed. Check DATABASE_URL, PSYCHOLOGIST_ALERT_EMAIL and SEED_*_PASSWORD (10+ characters) in .env.local.');
  process.exitCode = 1;
});
