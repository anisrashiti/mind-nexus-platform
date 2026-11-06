# Build record

## Phase 0
1. Scaffolded Next.js 15 / React 19 / strict TypeScript, Tailwind v4, next-intl, Radix controls and shared role layouts.
2. Added semantic tokens, fonts, exact supplied logo, favicon, environment template, Drizzle schema, migration and seed.
3. Added Postgres overlap, ledger idempotency, role/organization and append-only audit constraints.
4. Validation: lint, typecheck and unit tests passed before the phase commit; live infrastructure is not provisioned.
5. TODO(question): stable confirmed-only index plus locked settlement replaces an invalid time-dependent partial index; draft legal content, real client details, hours, translations and end grace remain open.

## Phase 1
1. Built responsive sign-in, invite acceptance, forgot/reset password screens and draft legal routes from Figma.
2. Added Argon2id passwords, single-use hashed invite/reset tokens, role redirects and live organization guards.
3. Implemented revocable opaque database sessions through the Auth.js Credentials codec, durable hashed rate limits, CSP and privacy headers.
4. Validation: lint, typecheck and unit tests passed before commit; authentication integration tests follow against isolated Postgres during final QA.
5. TODO(question): Auth.js Credentials requires JWT mode internally; documented the database-backed codec in AUTH.md. Legal approval and real service credentials remain release requirements.

## Phase 2
1. Implemented weekly availability toggles, multiple ranges, copy Monday, staged time-off editing and save/discard.
2. Built the UTC-returning slot engine with Europe/Belgrade wall times, overlap exclusion, notice limits and sorted deduplication.
3. Availability updates take the clinician row lock shared with booking, preserving existing appointments; corrected generated foreign-key ordering and verified migration/seed on isolated Postgres.
4. Validation: lint, typecheck and all slot tests passed before commit, covering grid, overlap, 12-hour/28-day boundaries, time off, range ends, both DST weekends and multiple ranges.
5. TODO(question): Fall-back ambiguous hours use date-fns-tz's canonical occurrence; nonexistent spring times are skipped. Confirm real weekly hours before launch.

## Phase 3
1. Built employee home, bookable-only week picker, consent confirmation, booked home, timed Join button, calendar download and cancellation dialog for desktop/mobile.
2. Booking locks employee and clinician, rechecks organization, allowance and availability, inserts appointment/ledger/consent/audit atomically, then emails outside the transaction.
3. Added allowance maths, 24-hour cancellation policy, idempotent refunds and expired-confirmed settlement; calendar content omits participant identities.
4. Validation: lint, typecheck, slot/allowance/cancellation/join-boundary unit tests passed before commit; database race and browser smoke tests are scheduled in final QA.
5. TODO(question): Approved full consent remains a production booking prerequisite; weekday UI follows the specified Mon–Fri row even if weekend hours are configured.

## Phase 4
1. Built the clinician's daily schedule, pending-outcome rows, join/cancel controls, unread count and three-day coming-up totals.
2. Added locked, idempotent give-back/keep decisions and psychologist cancellations with refunds and employee email.
3. Built organization editing, allowance stepper, statistics, employee search/filter and confirmed extra-session grants with audit records.
4. Validation: lint, typecheck and unit tests passed before commit; no employee identity or appointment status is exposed through HR components.
5. TODO(question): Sessions-used totals count completed sessions and clinician-kept late/no-show outcomes; pending decisions are excluded until the client confirms the reporting definition.

## Phase 5
1. Built the HR employee table, access search/filter, email chips invitation dialog, resend and deactivation confirmation.
2. Added normalized/deduplicated batch invites, hashed 14-day tokens, email delivery and existing-account skipping.
3. HR receives a restricted DTO and no per-person usage; totals below five are null before rendering. Deactivation privately cancels future bookings, refunds once and revokes access.
4. Validation: lint, typecheck and privacy/invite parser unit tests passed before commit; cross-role browser assertions are included in final QA.
5. TODO(question): No additional product behavior was inferred; the sessions-used reporting definition from phase 4 remains pending client confirmation.

## Phase 6
1. Added participant-only video routes, strict join window, lazy locked room creation, encrypted host/employee URLs and a development placeholder.
2. Verified current Whereby docs; disabled recording/transcription and implemented signed, role-bound, idempotent attendance webhooks.
3. Added authenticated five-minute reminder/attendance crons, idempotent no-show/refund handling and room cleanup; fixed a timestamp-serialization issue found by browser login QA.
4. Validation: lint, typecheck, raw-signature/replay/role tests and existing tests passed before commit; live Whereby/Resend calls remain unverified without service keys.
5. TODO(question): Whereby rejects the spec's externalId format and does not terminate at endDate; documented the signed metadata adaptation and app/cron end enforcement in VIDEO.md.

## Phase 7
1. Added the always-accessible employee urgent-help dialog/mobile sheet with the 112 link first, required message, optional phone and success toast.
2. Implemented AES-GCM storage, atomic durable five-per-hour rate limiting and an immediate clinician email containing no message body or phone.
3. Built the clinician inbox, preview/detail audits, read/handled states, call/email links and next-session context; HR has no inbox access.
4. Validation: lint, typecheck and all unit tests passed before commit; employee login has now been verified against local Postgres in Chrome.
5. TODO(question): No new product questions; live urgent-alert delivery awaits the client's Resend credentials and verified sender.

## Phase 8 — local validation complete; production release pending
1. Added the completed-session home, Figma-aligned mobile booking/confirmation/urgent layouts, responsive tablet fixes, accessible error states and localized metadata.
2. Hardened database-error privacy and auth lock ordering; handled native same-origin form submissions under no-referrer while rejecting opaque cross-site requests.
3. Validation: lint, typecheck, 54 tests (13 real Postgres), the Playwright booking/cancellation smoke, 12 axe-clean views, native invite/reset/login checks and the production build all passed.
4. Prepared Vercel fra1/Cron configuration, setup/release/QA documentation and a local phase commit; no push, production database provisioning or deployment was performed.
5. TODO(question): Production needs client infrastructure/keys, verified email/video delivery, approved legal/consent content, real organization/profile/hours and the previously recorded client decisions; this shipping portion remains outstanding.
