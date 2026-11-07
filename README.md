# Mind Nexus v1

Invite-only, organization-provided mental-health sessions for employees, one psychologist/admin and HR. Implemented with Next.js 15, React 19, strict TypeScript, Tailwind v4, Radix, next-intl, Postgres/Drizzle, Auth.js, Whereby and Resend. The product scope and design source are in [AGENTS.md](AGENTS.md).

## Run locally

Use Node 22 or newer and pnpm 10. This checkout was validated with Node 24.15 and pnpm 10.32.1 on Windows.

```powershell
pnpm install
Copy-Item .env.example .env
# Fill in the database, authentication, encryption and seed values in .env.
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Use a separate local database for development and an EU-region Postgres database for production. `pgcrypto`, `btree_gist` and `citext` must be available. Never put credentials in source files. `ENCRYPTION_KEY` must be a base64-encoded random 32-byte key; retain it securely because existing encrypted messages and room URLs require the same key.

The psychologist login email comes from `PSYCHOLOGIST_ALERT_EMAIL`; the HR email comes from `src/content/placeholders.ts`. Passwords come from the two `SEED_*_PASSWORD` values. Set `SEED_DEMO=1` only in development to create three explicitly named demo employees; active demo employees use the seed HR password. There is no public registration or production auth bypass.

Without Resend credentials, development logs only template names and user IDs. Without a Whereby key, development shows the requested video placeholder. Production requires the real services.

## Validation

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Unit tests run without a database. To include the Postgres transaction/privacy tests, set `TEST_DATABASE_URL` to a dedicated loopback database whose name ends in `_test`. Tests migrate that database, create synthetic organizations/employees and deactivate prior synthetic clinician fixtures; never point this setting at shared data. The smoke test requires the local development seed, installed Chrome and a running local app (or lets Playwright start one). It signs in, gives consent, books, verifies the calendar and cancels with a refund. Traces, videos and automatic screenshots are disabled to avoid saving confidential sessions.

The detailed phase record is [](). Auth.js Credentials/database compatibility is explained in [docs/AUTH.md](docs/AUTH.md), and current Whereby API differences in [docs/VIDEO.md](docs/VIDEO.md).

## Before production

Deployment is prepared for Vercel `fra1`; [vercel.json](vercel.json) defines both protected daily jobs for the Hobby plan (reminders at 07:00 UTC and attendance at 23:00 UTC). Provision Neon or Supabase in Frankfurt, apply migrations using a migration role, seed the real organization and clinician, and set the variables from `.env.example` in Vercel. Use a restricted application database role; grant only SELECT/INSERT on `audit_log`. Keep database/Resend/Whereby access within the client's approved region/account configuration.

Configure the Whereby webhook at `/api/webhooks/whereby`, add the application origin to its allowed domains, disable recording/transcription in the account, and verify a real employee/host call. Verify the Resend sender domain and actual delivery. Daily reminders cover unsent sessions starting within the next 24 hours; attendance catches up on ended sessions. A daily schedule cannot reliably deliver 15-minute reminders or mark no-shows promptly ([official Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)).

<!-- TODO: On Vercel Pro, set both crons back to */5 * * * * to restore 15-minute reminders and quick no-show marking. -->

Client-provided production accounts, domain/DNS, organization/contact details, bio, hours, full consent, terms/privacy and Albanian translations remain open. All approval switches and placeholder references live in [src/content/placeholders.ts](src/content/placeholders.ts). Production booking and invitation acceptance stay blocked until their legal content is approved; do not flip those switches without replacing the draft text. `messages/sq.json` is intentionally empty and falls back to English.

No production deployment or live email/video acceptance is implied by a successful local build.
