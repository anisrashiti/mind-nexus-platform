# Mind Nexus workplace platform

A high-fidelity client demo built with Next.js, TypeScript, Tailwind CSS, Radix Dialog, Lucide, and Recharts.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. Choose a role under **Explore demo**; no real credentials are needed. The discreet footer role switcher keeps shared demo changes when switching roles. Refresh the page to reset the demonstration.

## Demo walkthrough

1. Patient: join the simulated session, book a 15-minute appointment, reschedule/cancel, send a message, and complete the wellbeing check-in.
2. Psychologist: see the shared appointment/message/check-in, open Arta's record, save or sign a private note, and update weekly hours, breaks, time off, or calendar blocks.
3. Organization: view aggregate reporting, download the aggregate CSV, and add/import/deactivate fictional employee eligibility.
4. Mind Nexus Admin: assign Elira or Leon, manage the psychologist/service lists, filter operational appointments, and inspect the local audit trail.

English and Albanian navigation, headings, forms, and actions are centralized in `lib/i18n.ts` and `lib/sq-extra.ts`. Longer fictional records and resource body copy may remain in English.

## Scope and privacy

- All identities and records are fictional. `.example` email addresses are deliberately non-deliverable.
- September 14, 2026 is the fixed demo date; scheduling uses Europe/Tirane time.
- The shared React context is memory-only. Booking, notes, messages, assignments, settings, and eligibility changes reset on refresh. No backend or real authentication is implemented.
- The personal pool starts with three completed sessions and one reserved session, leaving one slot available for an immediate booking demonstration. Cancellation releases a reservation.
- Program totals and weekly clinician statistics are an illustrative historical snapshot. Detailed tables show a sample of the program rather than its full historical dataset. Booking changes affect the shared operational schedule; the historical aggregate snapshot does not change.
- The hospital sees eligibility and aggregate usage, never clinical notes, check-in responses, consultation reasons, or individual attendance. The operations admin has scheduling access; clinical content remains in the clinician workspace.
- These are UI boundaries for a prototype, **not real access controls**. All fictional mock data is bundled client-side.
- The session room does not request devices, transmit audio/video, or implement calling. Password recovery, two-factor authentication, personal-data export, and consent controls are clearly labeled preview concepts.
- This prototype does **not** claim HIPAA or GDPR compliance and is not for clinical care or real patient data.

## Implementation

`components/demo-context.tsx` owns the shared local state. Role-specific screens are split into patient, clinician, operations, messages, session, and profile components. Dialogs use Radix for focus trapping, keyboard dismissal, and accessible titles. The brand monogram and self-hosted Karla/Newsreader font files were reused from the existing local Mind Nexus marketing project; no external imagery or font requests are required.

The optional `navigate_workspace` WebMCP tool is feature-detected and scoped to the active role. Browsers without WebMCP work normally. Native WebMCP validation was unavailable in this environment.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Playwright uses installed Google Chrome and a running local server on port 3000. The suite covers role navigation, SQ/EN switching, notifications, booking changes, messaging across roles, wellbeing, the simulated room, notes, availability, eligibility CSV import, aggregate export, assignments, services, audit activity, and mobile overflow. Static export is produced in `out/`.
