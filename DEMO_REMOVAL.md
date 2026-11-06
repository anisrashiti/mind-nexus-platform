# Temporary demo mode

The preview URL is `/demo`. This is a shared, synthetic workspace: every viewer sees the same sample data. Reset restores all views and revokes all demo sessions; append-only audit history is retained. Access grants last eight hours and are invalidated by changing the access code or `AUTH_SECRET`.

## Set up on Vercel

1. Create a **separate, empty EU Postgres database for the preview**. Never use the client production database. The demo refuses seeding, sign-in and authenticated pages if it detects any non-demo user or another organization, because the existing single-psychologist views can see all clinician data.
2. In the preview deployment's environment variables set `DATABASE_URL` to that database, `DEMO_MODE=true`, a private random `DEMO_ACCESS_CODE` (20+ characters recommended), `AUTH_SECRET`, a base64 32-byte `ENCRYPTION_KEY`, and `APP_URL` to the preview origin. Apply these only to the intended preview environment. Real Resend/Whereby credentials are unnecessary. Keep `DEMO_MODE=false` for the real application.
3. With the same preview database/environment locally, run `pnpm db:migrate` and `pnpm demo:seed`. Apply migrations to every database running this branch, including deployments with demo mode off; the new column defaults to false for existing users. Do not run `pnpm db:seed` against the preview database: that command creates real-account fixtures. The protected **Reset demo data** control can also initialize the sample dataset after migrations.
4. Redeploy after setting the variables, open `https://<preview-domain>/demo`, enter the access code, then choose a view. Share the code privately. No account password is needed.

## Run the preview locally

Next.js reads `.env.local` in the project root; `.env.example` is a template and is never loaded. Keep real values out of the template and Git. Migration, Drizzle configuration and demo seed commands read `.env.local` first, then `.env`; existing process environment values take precedence.

Create `.env.local` from the template if it does not exist. Preserve existing secrets. Set `DEMO_MODE=true`, a local `DEMO_ACCESS_CODE`, `APP_URL=http://localhost:3000`, `AUTH_SECRET`, and a base64 32-byte `ENCRYPTION_KEY`. Paste a connection string for a separate, empty demo Postgres database into `DATABASE_URL` in that file. Resend, Whereby and normal seed passwords are unnecessary for this demo. Do not use the normal `db:seed` command.

After configuring the database, run these from the project root:

```powershell
npm.cmd run db:migrate
npm.cmd run demo:seed
npm.cmd run dev
```

Open `http://localhost:3000/demo` and enter the code from `.env.local`. On later runs, only `npm.cmd run dev` is needed; rerun `demo:seed` when you want fresh sample states. Restart the dev server after editing environment variables. The same scripts also work through pnpm.

The only demo flag is `DEMO_MODE`, and it must equal the exact string `true`. There is no `NEXT_PUBLIC_DEMO_MODE` check and no production-only demo gate. Missing `DEMO_ACCESS_CODE` or `AUTH_SECRET` also makes `/demo` return 404. Demo actions require a valid, unexpired access cookie. `NODE_ENV` and an HTTPS `APP_URL` select secure cookies, rather than enabling the demo. Auth.js trusts the host in development or when `VERCEL` is set. `SEED_DEMO` belongs to the separate normal database seed, not this feature. `RESEND_API_KEY`, `WHEREBY_API_KEY`, `EMAIL_FROM`, `PSYCHOLOGIST_ALERT_EMAIL`, `WHEREBY_WEBHOOK_SECRET`, and normal seed passwords are unnecessary for demo sign-in; `CRON_SECRET` only protects cron endpoints, whose jobs are skipped in demo mode.

An unavailable view means the database is unreachable/unmigrated, contains non-demo users or another organization, lacks an active seeded user of the expected role/admin status, or cannot create its session. A reset also needs a valid encryption key and database permissions. Bad view/reset inputs return unavailable; wrong codes and rate limits have separate messages. These checks stay active locally and in production.

The demo creates normal hashed database sessions with the existing Auth.js cookie names/options. Role, organization, ownership, allowance, 12-hour notice, cancellation, consent and video join-window checks remain active. HR still sees only access data and anonymous totals; the sample total remains hidden below five. The existing production consent/legal approval gates are deliberately preserved, so confirming a new booking on Vercel remains blocked while client approval is pending.

Seed/reset uses the real current time and 30-minute starts. **TODO(question):** near the end of the Kosovo day, the upcoming schedule examples roll into tomorrow; reset again when reviewing the next day. Reset does not fake a clock or bypass join windows.

Emails emit only `demo: email skipped`, video uses the existing placeholder, and authenticated cron requests return `{ok: true, skipped: true}`. Turning the flag off makes `/demo` and its actions return 404, hides the banner and rejects existing demo sessions. No demo user has a password initially.

## Remove the feature

1. Stop preview traffic, set `DEMO_MODE=false`, and redeploy. Prefer deleting the dedicated preview database when it is no longer needed. If retaining it, use the guarded cleanup SQL below **before** dropping `users.is_demo`. The real application should use its own database.
2. Delete `src/demo/` and `src/app/demo/`.
3. Remove the marked `// DEMO: remove before production` integration lines from these files:
   - `src/app/layout.tsx`: the banner import and render; retain the provider and children.
   - `src/lib/auth/config.ts`: the helper import and both account checks; restore the session lookup projection to `{ id: users.id, status: users.status }`.
   - `src/lib/auth/guards.ts`: helper import and demo-user check.
   - `src/lib/hr/actions.ts`: helper import and the `isDemo` insert property.
   - `src/lib/email/send.tsx`: skip helper import and early return.
   - `src/lib/video/whereby.ts`: helper import and early returns in creation/cleanup.
   - `src/app/api/cron/reminders/route.ts` and `src/app/api/cron/attendance/route.ts`: helper import and skipped response.
   - `src/lib/db/schema.ts`: `isDemo` column definition.
4. Remove the `demo` namespace from `messages/en.json`, the `demo:seed` script from `package.json`, and `DEMO_MODE` / `DEMO_ACCESS_CODE` from `.env.example`, local env files and Vercel environments. Keep the pre-existing `SEED_DEMO`; it belongs to the original local development seed.
5. After data cleanup and removal of the schema property, run `pnpm db:generate --name=remove_demo_mode`, review the generated `DROP COLUMN is_demo`, and run `pnpm db:migrate`. **Retain applied migration history**, including `0001_temporary_demo_mode.sql`, `meta/0001_snapshot.json` and its `_journal.json` entry; deleting applied migrations breaks existing database history.
6. Remove this document and the temporary-demo README section. Run `pnpm lint && pnpm typecheck && pnpm test`, redeploy, and confirm `/demo` returns 404. Daily Hobby cron schedules are independent of demo mode; keep them unless upgrading the Vercel plan.

## Cleanup SQL for the isolated preview database

Run as the database owner with preview traffic stopped. This deliberately refuses mixed/real databases. Only this explicit one-time purge disables the append-only trigger to remove synthetic audit rows that otherwise prevent deleting demo users; the application reset never disables it. A transaction failure rolls everything back, including the trigger change.

```sql
BEGIN;
LOCK TABLE users, organizations IN ACCESS EXCLUSIVE MODE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE is_demo = false)
     OR EXISTS (SELECT 1 FROM organizations
                WHERE id <> 'de000000-0000-4000-8000-000000000001') THEN
    RAISE EXCEPTION 'Refusing demo cleanup: database contains non-demo records';
  END IF;
END $$;
CREATE TEMP TABLE demo_user_ids ON COMMIT DROP AS SELECT id FROM users WHERE is_demo = true;
CREATE TEMP TABLE demo_entity_ids ON COMMIT DROP AS
  SELECT id FROM demo_user_ids
  UNION SELECT id FROM appointments WHERE employee_id IN (SELECT id FROM demo_user_ids)
  UNION SELECT id FROM urgent_messages WHERE employee_id IN (SELECT id FROM demo_user_ids)
  UNION SELECT id FROM organizations WHERE id = 'de000000-0000-4000-8000-000000000001';
ALTER TABLE audit_log DISABLE TRIGGER audit_append_only;
DELETE FROM audit_log WHERE actor_id IN (SELECT id FROM demo_user_ids)
  OR entity_id IN (SELECT id FROM demo_entity_ids);
ALTER TABLE audit_log ENABLE TRIGGER audit_append_only;
DELETE FROM sessions WHERE user_id IN (SELECT id FROM demo_user_ids);
DELETE FROM accounts WHERE user_id IN (SELECT id FROM demo_user_ids);
DELETE FROM password_resets WHERE user_id IN (SELECT id FROM demo_user_ids);
DELETE FROM consents WHERE user_id IN (SELECT id FROM demo_user_ids);
DELETE FROM urgent_messages WHERE employee_id IN (SELECT id FROM demo_user_ids);
DELETE FROM session_ledger WHERE employee_id IN (SELECT id FROM demo_user_ids);
DELETE FROM appointments WHERE employee_id IN (SELECT id FROM demo_user_ids);
DELETE FROM invites WHERE organization_id = 'de000000-0000-4000-8000-000000000001';
DELETE FROM time_off WHERE psychologist_id IN (SELECT id FROM demo_user_ids);
DELETE FROM availability_rules WHERE psychologist_id IN (SELECT id FROM demo_user_ids);
DELETE FROM psychologist_profiles WHERE user_id IN (SELECT id FROM demo_user_ids);
DELETE FROM users WHERE id IN (SELECT id FROM demo_user_ids);
DELETE FROM organizations WHERE id = 'de000000-0000-4000-8000-000000000001';
COMMIT;
```
