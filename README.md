# Mind Nexus · Aurora Hospital prototype

A bilingual, local demonstration of confidential employer-sponsored psychological support. Built in the existing Next.js application with self-hosted Karla and Newsreader, Lucide, Radix dialogs and fictional data.

## Run and validate

```powershell
npm.cmd run dev
# http://localhost:3000

npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
```

Build before testing: Playwright serves the static `out/` export on port 3100 using installed Chrome. Checks cover the five requested viewport widths (1440, 1280, 1024, 768, 390), English/Albanian layouts, care continuity, privacy boundaries, booking, cancellation, rescheduling, allowance and pool accounting, private continuation, messages, reflections, notes, availability, calendar blocks, eligibility imports, reports, keyboard controls and account actions.

If Windows stalls during Playwright's server teardown, start `node tests/serve.mjs` in a separate terminal, then run `$env:MIND_NEXUS_REUSE_PREVIEW='1'; npm.cmd test`. This explicitly uses that existing local preview without having Playwright manage its lifecycle. Stop the preview with Ctrl+C afterward.

## Product structure

- **Employee:** Home, Sessions, Messages, Resources. Profile, language, notifications and privacy are in Account. Four-step first-use onboarding explains the benefit and concrete privacy boundaries, then asks the employee to choose a psychologist.
- **Psychologist:** Today, Calendar, Clients, Messages, Availability. Client records contain Overview, Sessions, Notes, Reflections and Documents. In this demonstration, switching to Psychologist opens the employee's chosen professional, including their own schedule and care records.
- **Mind Nexus:** Overview, Program, Employees, Psychologists, Sessions, Reports. Program tabs hold eligibility, the network, service rules, session pool and contract. Audit is accessed through Account. There is no hospital-admin workspace.

## Presentation walkthrough

1. Enter **Mind Nexus** under Prototype access. Show Aurora Hospital's program, 500 purchased consultations, three consultations per employee, and aggregate reporting.
2. Switch to **Employee** using the footer. Read the welcome and privacy explanation, acknowledge it, inspect profiles and choose a psychologist.
3. Home shows the next session, completed/reserved/available entitlement, the chosen psychologist and one featured resource. Book the remaining employer-funded consultation, reschedule or cancel it.
4. Once all three consultations are completed or reserved, open **Continue privately**. Registering interest only records a local demo flag. No payment is collected or request sent.
5. Send a message and optionally share an unscored reflection. Enter the simulated session; microphone, camera and chat controls are illustrative.
6. Switch to **Psychologist**. Open the matching client record, review the message/reflection, save or complete a private note, and configure individual half-hour availability cells.
7. Return to **Mind Nexus**. Reservations affect the pool. Generate a date-filtered aggregate report and download a CSV containing no identities or clinical content.

## Demo decisions and boundaries

- Aurora Hospital and all people, profiles, records and contact addresses remain fictional. Portraits use the existing initials placeholders.
- The presentation uses a fixed **14 September 2026** demo day and **Europe/Prishtina** display wording. It is not a live calendar clock.
- After the initial choice, the seeded Arta scenario represents that chosen care relationship: one completed consultation, one upcoming consultation and one available. Bookings never choose a different psychologist. A subsequent change is a separate local request; it does not transfer clinical records or change appointments.
- Key fictional records persist in `sessionStorage` within the current tab. Reload returns to Prototype access and preserves the scenario. Use a fresh browser session or clear this site's session storage for a fresh walkthrough. There is no database, real authentication or cross-device persistence.
- One booking reserves two consecutive 30-minute availability cells: a full hour, with approximately 50 minutes of consultation and 10 minutes of buffer. Conflicting employee and psychologist reservations are excluded.
- The existing no-show policy is retained: no-shows consume entitlement and the employer pool. Cancellation releases the reservation. Private-funded appointments are excluded from employer allowance/pool calculations; the private flow itself records interest only.
- The contract example runs April 2026–March 2027. Historical usage consists of 125 dated anonymous synthetic records; the seeded completed appointment brings the initial used total to 126. Six reservations leave 368 available. Reports combine that historical fixture with local employer-funded appointments. Current pool figures and selected-period activity are clearly separated. No wait-time metric is invented.
- Hospital reporting contains aggregates only. General employee lists show eligibility, never service participation. Operations can see scheduling metadata but no note bodies, message content, consultation reasons or reflections.
- These are **prototype UI boundaries, not real security controls**: all fictional data is bundled client-side. This is not a production clinical system and does not claim GDPR or HIPAA compliance.
- Real payments, communications, emergency response, video/audio transmission, identity verification, data requests and consent enforcement are not implemented. CSV report downloads work locally. Placeholder workflows say when nothing is transmitted.

## Implementation map

- `app/globals.css`, `app/editorial.css`: semantic palette, typography, surfaces, responsive compositions and reduced-motion support.
- `components/care.tsx`: onboarding, professional profiles, privacy explanation and private continuation.
- `components/patient.tsx`, `components/booking.tsx`: employee home, sessions, reflection, resources and reservations.
- `components/clinician.tsx`: Today, client records, notes, calendar and weekly availability.
- `components/program.tsx`, `components/operations.tsx`: program, network, eligibility, operational sessions, aggregate reports and audit.
- `components/demo-context.tsx`, `lib/use-demo-storage.ts`, `lib/data.ts`, `lib/scheduling.ts`: chosen care relationships, per-professional schedules, persisted fictional state, program pool and entitlement rules.
- `components/platform.tsx`, `components/shell.tsx`, `components/profile.tsx`: login, role routing, navigation and account preferences.
- `components/messages.tsx`, `components/session-room.tsx`, `components/ui.tsx`: care-linked communication, simulated room and accessible shared controls.
- `lib/i18n.ts`, `lib/editorial-i18n.ts`, `lib/sq-extra.ts`: centralized translations. User-entered fictional messages, notes and profile edits retain the language in which they were entered.
- `tests/demo.spec.ts`, `tests/scheduling.spec.ts`: workflow, responsive and scheduling regression checks.

The optional WebMCP navigation capability remains feature-detected and limited to the active role's primary pages. Its native integration has not been independently verified. The existing Sites project currently returns “project not found”; local build success does not establish a hosted deployment.
