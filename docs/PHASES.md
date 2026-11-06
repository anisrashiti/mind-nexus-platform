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
