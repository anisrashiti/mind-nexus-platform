# Local validation evidence

Validated on Windows with Node 24.15, pnpm 10.32.1, Next.js 15.5.29 and Chrome. All database data used for QA was synthetic and isolated on loopback. No client service keys, production database or live employee records were used.

- `pnpm lint`: zero warnings/errors.
- `pnpm typecheck`: strict TypeScript passes.
- `pnpm test`: 54 tests pass, including 13 against real isolated Postgres and six native-form/CSRF checks.
- `pnpm test:e2e`: employee login → choose time → required consent → confirmed home → private calendar download → cancel → refunded allowance.
- `pnpm build`: optimized production build succeeds; all protected/application routes render dynamically.

Postgres tests cover concurrent bookings for one employee, competing employees, exclusion constraints, allowance/consent writes, free/late cancellation, idempotent psychologist no-show refunds, HR data projection, organization foreign keys, immutable audit records, concurrent rate limits, encrypted host/participant room separation, signed attendance webhooks and reminder idempotency. Whereby/Resend HTTP behavior is mocked in integration tests; actual provider behavior remains an external acceptance requirement.

Browser QA covered employee screens at 320, 360, 390, 768, 1024 and 1440px, booking/confirmation at their applicable widths, and clinician/HR layouts at tablet/desktop widths. Visual inspection corrected a tablet scroll-container overflow and a mobile profile-card cascade issue. The urgent sheet opens against the viewport bottom; Escape closes it and restores focus to its trigger.

Automated axe checks found no WCAG 2 A/AA or 2.1 AA violations on 12 views: sign-in, employee home, urgent dialog, booking, confirmation, completed home, schedule, availability, organization, urgent inbox, HR and invite dialog. This is automated coverage plus targeted keyboard review, not a claim of a formal WCAG certification.

Additional browser checks verified:

- Employee/HR role redirects and no urgent-message content in HR HTML.
- AES-GCM urgent body/phone storage, clinician reading/handling audits and hidden usage totals below five.
- Invitation deduplication, HR deactivation with a private refund, and generic deactivation responses.
- Invite acceptance and single-use tokens, Argon2id storage, password-reset single use, immediate old-session revocation and identical forgot-password responses for known/unknown accounts.
- Native login with JavaScript disabled under the required no-referrer policy; opaque cross-site origins remain rejected.
- CSP presence, no-referrer, camera/microphone restrictions and unauthorized Cron rejection.
- The built production server returned the sign-in page with matching script nonces, enforced CSP, no CSP console errors, HSTS, no-referrer, restricted permissions and 403 for opaque cross-site form submissions.

No source secrets were found in tracked files. Existing user edits to AGENTS.md were preserved without staging. Native Git was unavailable, so the phase commits were created in the existing `.git` repository using a local isomorphic-git helper. No push or production deployment was performed.
