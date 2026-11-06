# Release handoff

The local implementation follows phases 0–8 of AGENTS.md. Employee, psychologist/admin and HR views have separate server guards. Clinical notes, public signup, tracking, payments, rescheduling and other out-of-scope features are absent.

## Required client configuration

- EU Postgres and Vercel account/project, domain and five-minute Cron support.
- Whereby API key, webhook secret and allowed application domain; confirm account-wide recording/transcription settings.
- Resend API key, real alert mailbox, verified sender/DNS.
- Stable production `AUTH_SECRET`, `CRON_SECRET`, HTTPS `APP_URL` and 32-byte base64 `ENCRYPTION_KEY`.
- Real organization/HR details and clinician-approved bio/hours, informed consent/version, terms and privacy policy.
- Client decision on the end-of-session grace period; currently zero. Albanian translations follow launch.

## Documented interpretations

- Auth.js's Credentials provider requires internal JWT mode; an opaque token codec retains revocable, hashed Postgres sessions. See AUTH.md.
- Postgres forbids `now()` in a partial index. A confirmed-only unique index plus employee locking and expired-session settlement enforces one active booking.
- The Mon–Fri booking UI follows the specification; weekend availability does not add weekend chips.
- HR usage includes completed sessions and clinician-kept late/no-show outcomes. Pending outcomes remain excluded.
- Whereby externalId format and endDate behavior differ from the supplied assumptions. Signed participant metadata, strict app join checks, iframe expiry and Cron deletion address these differences; see VIDEO.md.

## Operational checks before launch

Run migrations and seed against the selected EU database, then run lint/type/unit checks and the employee smoke flow against staging. Verify role separation with real test accounts, real email receipt, host/employee URL separation, signed webhooks, no-show/refund jobs, both reminders and the production security headers. Browser and local DB tests cannot verify the client's region, DNS or external account policies.

## Recovery

Keep the encryption key backed up separately from the database and preserve both across deployments. Password resets revoke existing sessions. Deactivation revokes database sessions and silently refunds future appointments. Ledger refunds are unique per appointment; repeated Cron/outcome requests do not duplicate them. Database errors are stripped of SQL text and parameters before framework logging. Investigate failures using entity IDs only.

Email failures outside booking transactions are logged by template and entity ID; the booking remains confirmed. Reminder delivery is retried by Cron using provider idempotency keys. Other transactional emails can be resent through existing invite controls where available; production delivery-failure monitoring is an operational launch requirement.
