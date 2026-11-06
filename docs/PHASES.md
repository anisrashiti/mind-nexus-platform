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
