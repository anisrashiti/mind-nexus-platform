# AGENTS.md — Mind Nexus v1

Read this whole file before writing any code. It is the source of truth for scope, rules, design and build order.
If something here conflicts with your own assumptions, this file wins. If something is missing or ambiguous, leave a
`TODO(question): …` comment, choose the simplest safe option, and list it in your phase summary. Don't invent features.

- **Product:** Mind Nexus, a confidential mental-health session platform that organizations provide to their employees.
- **Client studio:** NALT Studio.
- **Deadline:** **Monday 9 November 2026.** Ship the smallest complete version. Every rule below exists to make that possible.
- **Design:** Figma file `TXRNEUvxd0UQoUonBzSMAC` ("mind-nexus-platform"), page **Final v1**, at https://www.figma.com/design/TXRNEUvxd0UQoUonBzSMAC/mind-nexus-platform
- **Spec (human-readable):** https://claude.ai/artifact/BCiAYDfydZRZHYGVNSqUFo

---

## 1. Ground rules for agents

1. **Scope is fixed.** Build only what is in §3 and §9. Section §17 lists what is out of scope. Do not add it "for later".
2. **Privacy first.** This app handles mental-health data. Never log message bodies, phone numbers or names. Never send them to analytics. Never expose one role's data to another (see §5).
3. **Keep it simple.** Prefer server components and server actions over API routes. Prefer plain Postgres constraints over app-level checks. No state libraries, no microservices, no queues beyond Vercel Cron.
4. **Work in the phases of §16, in order.** At the end of each phase:
   - run `pnpm lint && pnpm typecheck && pnpm test`;
   - commit with a message like `phase 2: availability + slot engine`;
   - write a 5-line summary of what was done and any `TODO(question)` items.
5. **Never commit secrets.** All keys come from env vars (§14). Provide `.env.example`.
6. **Placeholders:** some content is not final (§18). Mark it with `TODO(content): …` and keep it in one file, `src/content/placeholders.ts`, so it is easy to replace.
7. **English first, i18n-ready.** All user-facing strings go through `next-intl` message files (`messages/en.json`). Albanian (`sq`) is added after launch. Create an empty `messages/sq.json` that falls back to English.
8. **Accessibility:**
   - meet WCAG 2.1 AA;
   - keyboard focus must be visible on everything (2px ring in `--color-border-focus`);
   - give every icon-only button an `aria-label`;
   - honour `prefers-reduced-motion`.

---

## 2. Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 with CSS variables from §8; shadcn/ui (Radix) as the base for Dialog, Sheet, DropdownMenu, Checkbox, Switch, Toast |
| Icons | `lucide-react` (stroke width 1.75) |
| Database | Postgres in an EU region (Neon or Supabase, Frankfurt). Drizzle ORM + drizzle-kit migrations |
| Auth | Auth.js (NextAuth v5) Credentials provider, email + password (argon2id), database sessions. Invite-only, no public sign-up |
| Video | Whereby Embedded (§11) |
| Email | Resend + React Email templates (§12) |
| Jobs | Vercel Cron hitting protected route handlers (§12) |
| i18n | `next-intl` |
| Validation | `zod` on every server action input |
| Dates | `date-fns` + `date-fns-tz`. Store UTC; display and compute slots in `Europe/Belgrade` (Kosovo time) |
| Tests | Vitest (unit), Playwright (one smoke e2e) |
| Package manager | pnpm |
| Hosting | Vercel, functions region `fra1` |

Suggested structure:

```
src/
  app/
    (auth)/login, invite/[token], forgot, reset/[token]
    (employee)/page.tsx            -> home (E04 / E07 / E11 states)
    (employee)/book/page.tsx       -> E05
    (employee)/book/confirm/page.tsx -> E06
    (employee)/session/[id]/page.tsx -> E09 video
    psychologist/page.tsx          -> L1 schedule
    psychologist/availability/     -> L2
    psychologist/urgent/           -> L3
    psychologist/organization/     -> L4
    hr/page.tsx                    -> H1 (+ H2 dialog)
    api/webhooks/whereby/route.ts
    api/cron/reminders/route.ts
    api/cron/attendance/route.ts
  components/ui/        (button, badge, avatar, input, select, toggle, stat-card, day-chip, time-slot, dialog, sheet)
  components/layout/    (top-bar-employee, top-bar-hr, top-bar-mobile, sidebar-psychologist, urgent-help-dialog)
  lib/db/               (schema.ts, client.ts, migrations/)
  lib/booking/          (slots.ts, allowance.ts, cancel.ts) + *.test.ts
  lib/video/whereby.ts
  lib/email/            (send.ts, templates/*.tsx)
  lib/auth/             (config.ts, guards.ts)
  lib/crypto.ts         (AES-256-GCM for sensitive fields)
  content/placeholders.ts
messages/en.json, messages/sq.json
```

Scripts in `package.json`: `dev`, `build`, `start`, `lint`, `typecheck` (tsc --noEmit), `test` (vitest run), `test:e2e`, `db:generate`, `db:migrate`, `db:seed`.

---

## 3. Product scope and roles

v1 is **one organization** (under 100 employees, in Kosovo) and **one psychologist**.

| Role | Who | Can do |
| --- | --- | --- |
| `employee` | Staff invited by HR | Accept invite, sign in, book their session, give consent, cancel, join the video call, send an urgent message, switch language |
| `psychologist` (+ admin) | **Luljeta Berisha**, Clinical psychologist. She is also the platform admin (`users.is_admin = true`) | Set weekly hours and time off; see her schedule; join calls; decide late cancels and no-shows; cancel sessions; read urgent messages; edit the organization (HR contact, sessions per employee); give an employee an extra session |
| `hr` | The organization's HR contact | Invite employees (paste emails), resend invites, deactivate access, see anonymous totals |

Luljeta conducts sessions in **Albanian**. The interface ships in English first.

---

## 4. Business rules (implement exactly)

| Rule | Value |
| --- | --- |
| Sessions per employee | `organizations.sessions_per_employee`, default **1**. Never renews. Luljeta can change it, or grant individual extras |
| Session length | **50 minutes**. Start times on a **30-minute grid** (:00 / :30) |
| Overlap | A booking at 10:00 (10:00–10:50) also blocks the 10:30 start. Enforced by a DB exclusion constraint (§10) |
| Confirmation | **Instant.** No approval step |
| Booking window | Start must be **≥ 12 hours** from now and **≤ 28 days** from now |
| One active booking | An employee can hold at most **one** future confirmed appointment at a time |
| Free cancellation | Employee cancels **≥ 24 h** before start → status `cancelled`, session returned automatically (ledger `+1 refund`) |
| Late cancellation | Employee cancels **< 24 h** before start → status `late_cancelled`, `outcome = pending`. Luljeta decides: **Give session back** (`+1 refund`, outcome `given_back`) or **Keep as used** (outcome `kept`) |
| No-show | 15 min after start, if the employee never joined → status `no_show`, `outcome = pending`. Luljeta decides the same way |
| Psychologist cancels | Status `cancelled_by_psychologist`, always `+1 refund`, email the employee |
| Join window | Opens **10 minutes before** start. Closes at the **scheduled end** (`ends_at`). Keep this in `JOIN_GRACE_AFTER_END_MIN = 0` (pending client decision, may become 10) |
| Attendance | `completed` when both joined (from Whereby webhooks). If the employee joined but the psychologist never did, auto-refund and flag on L1 |
| Reminders | Email **24 h** and **15 min** before start |
| After the session is used | Home shows "Your session is complete" (E11). No booking UI unless the remaining allowance is > 0 |
| Time zone | All slot maths in `Europe/Belgrade`. Store `timestamptz` (UTC). Show "Kosovo time (CET)" labels |

### Remaining sessions (allowance)

```
remaining(employee) = organization.sessions_per_employee + SUM(session_ledger.amount WHERE employee_id = ?)
```

`session_ledger` entries:

| Reason | Amount | Written when |
| --- | --- | --- |
| `booking` | −1 | Written when an appointment is created |
| `refund` | +1 | Written for a free cancellation, psychologist cancellation, "give back", or psychologist no-show |
| `extra` | +1 | Written when Luljeta grants an extra session |

Raising `sessions_per_employee` therefore raises everyone's remaining immediately.

Booking must happen in **one transaction**:

1. `SELECT … FOR UPDATE` the employee's `users` row.
2. Check `remaining ≥ 1`, that there is no other future confirmed appointment, and that the slot is still valid (§7).
3. Insert the appointment, which may fail on the exclusion constraint. Show the error "That time was just taken — pick another".
4. Insert the ledger row (`booking`, −1).
5. Commit, then send the confirmation email outside the transaction.

---

## 5. Privacy, safety and authorization

### Who sees what

| Role | Sees | Never sees |
| --- | --- | --- |
| Employee | Own appointments, own allowance, Luljeta's public profile and open times | Anyone else's data |
| Psychologist | Employee full name, email, organization, appointment status, urgent messages (body + optional phone) | Nothing is hidden; she is clinician and admin |
| HR | Employees of their own organization: name, email, access status, invited date. Org totals: invited, accounts created, sessions used | Who booked, attended, cancelled or messaged; any appointment row; any urgent message |

- **HR totals:** "Sessions used" is shown only when the org total is **≥ 5**. Below that, show "Hidden until 5 sessions are used".
- **Guards:** every server action and page calls a guard from `lib/auth/guards.ts` (`requireEmployee`, `requirePsychologist`, `requireHr`). The guard checks the role and that `organization_id` matches. Never trust IDs from the client without re-checking ownership.
- **Encryption:** encrypt `urgent_messages.body`, `urgent_messages.phone` and the Whereby room URLs with AES-256-GCM (`lib/crypto.ts`, key from `ENCRYPTION_KEY`).
- **Audit log:** append-only `audit_log` (actor_id, action, entity, entity_id, created_at) for:
  - viewing or handling urgent messages;
  - appointment status changes;
  - extra session grants;
  - org setting changes.
- **Consent:** required at **first booking** (E06). Store a `consents` row (user_id, version, accepted_at). Keep the current consent version in `content/placeholders.ts`. The full consent text is `TODO(content)`.
- **No clinical notes** are stored anywhere in the app.
- **Video is never recorded.** Do not enable Whereby recording or transcription.
- **Urgent help:**
  - Always reachable from the header (desktop and mobile), including after the session is used.
  - Shows **"In immediate danger? Call 112"** first (as a `tel:112` link), then the message form.
  - Sending creates `urgent_messages` and immediately emails Luljeta. The email says only "New urgent message from {full name} — open Mind Nexus"; never put the message body in email.
  - Rate limit: 5 per user per hour.
- **Logging:** never log request bodies, emails, names, phone numbers or message content. Log IDs only.
- **Security headers:**
  - strict CSP (allow Whereby's domain in `frame-src`);
  - `Referrer-Policy: no-referrer`;
  - `Permissions-Policy` allowing camera and microphone only on `/session/*`;
  - httpOnly, secure, sameSite=lax cookies.
- **Auth:**
  - Invite tokens and reset tokens are random 32 bytes, stored **hashed**.
  - Invites expire after 14 days; reset links after 30 minutes.
  - Password ≥ 10 characters, checked against a small common-password list.
  - Login rate limit: 10 attempts per 15 minutes per IP + email.
  - Login error message: "Email or password is incorrect" (never reveal which).

---

## 6. Roles → routes

| Route | Role | Figma |
| --- | --- | --- |
| `/login` | public | E01, M1 |
| `/invite/[token]` | public (valid token) | E02 |
| `/forgot`, `/reset/[token]` | public | E03, E03b |
| `/` | employee | E04 (not booked), E07 (booked), E11 (used) + E08 cancel dialog, E10 urgent dialog; mobile M2, M5, M6 |
| `/book` | employee with remaining ≥ 1 and no future booking | E05, M3 |
| `/book/confirm?start=ISO` | same | E06, M4 |
| `/session/[appointmentId]` | the appointment's employee or the psychologist, inside the join window | E09 |
| `/psychologist` | psychologist | L1 |
| `/psychologist/availability` | psychologist | L2 |
| `/psychologist/urgent` | psychologist | L3 |
| `/psychologist/organization` | psychologist | L4 |
| `/hr` | hr | H1 + H2 dialog |

After login, redirect by role: employee → `/`, psychologist → `/psychologist`, hr → `/hr`.

---

## 7. Slot engine (`lib/booking/slots.ts`)

`getAvailableSlots(psychologistId, fromDate, toDate, now)` returns UTC start times.

1. For each local date in `Europe/Belgrade` between `fromDate` and `toDate`:
   1. Take the `availability_rules` for that weekday (there may be several ranges).
   2. Within each range, generate starts every 30 minutes from `start_time`, while `start + 50 min ≤ end_time`.
2. Drop a candidate if any of these is true:
   - `start < now + 12h`;
   - `start > now + 28 days`;
   - it overlaps any `time_off` range;
   - its interval `[start, start+50m)` overlaps any appointment with status in (`confirmed`, `completed`, `no_show`, `late_cancelled`).
3. Return a sorted, de-duplicated list. Handle DST correctly: build local times with `date-fns-tz`, then convert to UTC.

Unit tests (required):
- 30-minute grid inside a range;
- 10:00 booked blocks 10:00 and 10:30 but not 11:00;
- 12-hour minimum notice;
- 28-day maximum;
- time off;
- range end (no 16:30 start in a range ending at 17:00);
- the DST switch weekend (29 March and 25 October);
- multiple ranges per day.

UI (E05/M3):
- Week navigation (Mon–Fri row; disable days with no slots).
- **Show bookable times only.** Don't render taken times.
- Group times into Morning and Afternoon only if there are more than 6.

---

## 8. Design system (from Figma — implement as CSS variables)

### Colors (semantic tokens → hex)

```css
:root {
  --color-bg-canvas: #FEF7F0;        /* page background (cream) */
  --color-bg-surface: #FFFFFF;       /* cards, inputs */
  --color-bg-subtle: #F6F4F0;
  --color-bg-muted: #EDEAE4;
  --color-bg-accent: #F8EDE1;        /* warm info panels */
  --color-bg-brand: #842A14;         /* primary buttons, selected */
  --color-bg-brand-hover: #6B2210;
  --color-bg-brand-subtle: #FBF1EC;
  --color-bg-brand-soft: #F5DDD3;
  --color-bg-success-subtle: #EEF5F3;
  --color-bg-warning-subtle: #FBEFD5;
  --color-bg-danger-subtle: #FCE9E7;
  --color-bg-info-subtle: #E3EEF8;
  --color-bg-inverse: #1A1917;       /* sign-in panel, video page */

  --color-text-primary: #1A1917;
  --color-text-secondary: #5A564F;
  --color-text-tertiary: #6B665E;
  --color-text-on-brand: #FFFFFF;
  --color-text-brand: #842A14;
  --color-text-success: #215B4F;
  --color-text-warning: #86520A;
  --color-text-danger: #B3261E;
  --color-text-info: #2F6A9E;

  --color-border-default: #8C867B;   /* inputs, secondary buttons, time slots (≥3:1) */
  --color-border-subtle: #EDEAE4;    /* card outlines, dividers */
  --color-border-strong: #C5C0B6;
  --color-border-brand: #96361C;
  --color-border-focus: #C2623F;     /* focus rings, focused inputs */
}
```

Rules:
- Rust (`brand`) is for brand, primary actions and selection only.
- Positive status ("Confirmed", "Active", "1 session available") uses **success** (green).
- Privacy notes are **neutral** (`bg-subtle` + `text-secondary` + shield icon).
- Danger red is only for Urgent help, Cancel session, Delete and Leave.

### Spacing, radius, shadow

- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.
- **Radius:** sm 6, md 10 (buttons, inputs, slots), lg 14 (notes, inner panels), xl 20 (cards, dialogs), full 999 (badges, avatars, toggles).
- **Shadows:**
  - `sm: 0 1px 2px rgba(26,25,23,.04), 0 1px 3px rgba(26,25,23,.06)`
  - `md: 0 2px 4px -1px rgba(26,25,23,.04), 0 8px 20px -4px rgba(26,25,23,.08)` (hero, booking panel)
  - `lg: 0 24px 48px -12px rgba(26,25,23,.18)` (dialogs, sheets, popovers)

### Typography

Load **Newsreader** (400, 500) and **Instrument Sans** (400, 500, 600) with `next/font/google`.

| Style | Font | Size/line | Tracking |
| --- | --- | --- | --- |
| Display XL | Newsreader 400 | 48/56 | −1.5% |
| Display L | Newsreader 400 | 36/44 | −1% |
| Heading H1 | Newsreader 500 | 28/36 | −0.5% |
| Heading H2 | Instrument Sans 600 | 20/28 | −0.5% |
| Heading H3 | Instrument Sans 600 | 16/24 | 0 |
| Body L | Instrument Sans 400 | 16/26 | 0 |
| Body M | Instrument Sans 400 | 15/24 | 0 |
| Label M | Instrument Sans 500 | 15/22 | 0 |
| Label S | Instrument Sans 500 | 12/16 | 0 |
| Caption | Instrument Sans 400 | 13/18 | 0 |
| Overline | Instrument Sans 600, uppercase | 11/16 | +6% |

On mobile, Display L becomes Heading H1 size.

### Layout

- **Employee and HR:** top bar 72px (mobile 60px) with logo, EN/SQ switch, **Urgent help** (danger-subtle button, phone icon; employee only) and user menu (sign out). Content is centered, max width **1040px** (confirm page 640px). Page padding 40px top; 16px sides on mobile.
- **Psychologist:** left sidebar 264px containing:
  - logo and a "Psychologist · Admin" badge;
  - nav: Schedule, Availability, Urgent messages (with an unread count badge), Organization;
  - EN/SQ switch and user block at the bottom.

  Content padding is 40px.
- **Breakpoints:** mobile < 768px (single column, sticky bottom action bar on E05/E06), desktop ≥ 1024px. The psychologist and HR views can be desktop-first but must not break on tablet.
- **Dialogs:** 480–560px wide, radius 20, shadow lg, scrim `rgba(26,25,23,.45)`. On mobile, Urgent help is a bottom **sheet**.

### Components (match Figma Components page)

| Component | Spec |
| --- | --- |
| Button | Primary / Secondary (white + `border-default`) / Ghost (text-brand) / Danger (danger-subtle + text-danger). Sizes MD 40px, LG 48px. Optional leading icon 20px |
| Badge | Pill, 12px label. Tones: neutral, brand, success, warning, danger, info |
| Avatar | Initials. SM 32, MD 44, LG 96. Tone backgrounds: brand-soft, accent, lavender `#ECE9F7`, info-subtle. Initials in Newsreader for LG |
| Input | Label above, 44px field, leading icon, `border-default`; focus uses a 1.5px `border-focus` |
| Toggle | 40×24 |
| Day chip | 68×76, weekday + date; Selected (brand) / Disabled (subtle) |
| Time slot | ~118×44; Available (white + border) / Selected (brand) |
| Stat card | Overline label, 32px Newsreader value, caption |
| Note | Icon + text in a radius-lg panel; variants subtle / accent / success / danger |

### Logo

Save as `public/logo-mark.svg`. Use the mark at 32px plus the wordmark "Mind Nexus" in Newsreader 500, 22px, −1% tracking. On dark backgrounds the wordmark is white.

```svg
<svg width="1864" height="1864" viewBox="0 0 1864 1864" fill="none" xmlns="http://www.w3.org/2000/svg">
<circle cx="932" cy="932" r="907" fill="#FEF7F0" stroke="#000000" stroke-width="50"/>
<path d="M489 319 V938 M489 319 L722 942 L961 309 V942 M961 942 V1554 M961 942 L1366 1554 M1366 1554 L1368 949" stroke="#000000" stroke-width="33" stroke-linejoin="round" fill="none"/>
<circle cx="489" cy="319" r="45" fill="#842A14"/><circle cx="489" cy="938" r="45" fill="#842A14"/><circle cx="722" cy="942" r="45" fill="#842A14"/><circle cx="961" cy="309" r="45" fill="#842A14"/><circle cx="961" cy="942" r="45" fill="#842A14"/><circle cx="1368" cy="949" r="45" fill="#842A14"/><circle cx="961" cy="1554" r="45" fill="#842A14"/><circle cx="1366" cy="1554" r="45" fill="#842A14"/>
</svg>
```

Also generate the favicon from the mark.

The **node-and-line motif** (rust dots joined by thin ink lines) appears in two places:
- the sign-in side panel (faint network on `bg-inverse`);
- the "session complete" illustration.

Build these as inline SVG.

---

## 9. Screens

Every screen is on Figma page **Final v1**. Use the node IDs with the Figma MCP (`get_design_context` / `get_screenshot`, fileKey `TXRNEUvxd0UQoUonBzSMAC`) if you have it. Otherwise follow the descriptions.

### Employee — desktop (section "Employee · Desktop")

| ID | Node | Screen | Must include |
| --- | --- | --- | --- |
| E01 | 42:4 | Sign in | Split layout. Left `bg-inverse` panel with logo, headline "Support that fits into your workday.", 3 reassurance lines. Right: email, password, "Forgot password?", Sign in, note "No account yet? Your organization sends you an invite by email." Language switch top-right |
| E02 | 42:54 | Accept invite | "Invited by {Org}" pill; email read-only; name; password with live rules (≥10 chars, a number, not common); terms checkbox; Create account |
| E03 | 42:119 | Forgot password | Email → "Send reset link" |
| E03b | 42:169 | Check your email | Same response whether or not the account exists |
| E04 | 42:217 | Home · not booked | "Welcome, {first name}". Hero card: success badge "1 session available", "Talk to Luljeta, privately", description, **Book your session**. Right panel: Luljeta avatar, title, "Sessions in Albanian", next available slot. Three info cards (Pick a time / Join by video / Plans change?). Privacy note |
| E05 | 42:340 | Book a time | Back to Home. Left: Luljeta profile (About = placeholder), 3 "Your session" lines. Right booking panel: week nav, day chips, bookable times only, selected summary, Continue |
| E06 | 42:471 | Confirm & consent | Details (date, time, where), cancellation note with the computed "Free cancellation until {start−24h}", consent box (4 bullets + "Read the full consent" link + required checkbox), Back / **Confirm booking** (disabled until the box is ticked) |
| E07 | 43:397 | Home · booked | Session card: date block, "Confirmed" success badge, "Video session with Luljeta Berisha", time; **Join session** (disabled with caption "Opens at HH:MM, 10 minutes before" until the window, then enabled), Add to calendar (.ics download), Cancel session (ghost). Notes: free cancellation deadline; privacy |
| E08 | 43:492 | Cancel dialog | Copy changes by timing: ≥24h → success note "you keep your session"; <24h → warning note "Late cancellations: Luljeta decides whether you can book again". Keep session / Cancel session (danger) |
| E09 | 43:552 | Video session | `bg-inverse` page: logo, "Private session with {other person} · HH:MM–HH:MM", Urgent help (employee only). Full-height Whereby embed (§11) |
| E10 | 43:591 | Urgent help dialog | Danger panel "In immediate danger? Call 112" (tel link); "Or send an urgent message to Luljeta"; textarea (required, max 2000); phone (optional); caption; Cancel / Send to Luljeta. Success toast: "Sent. Luljeta will contact you as soon as she can." |
| E11 | 43:675 | Home · session used | Illustration, "Your session is complete", explanation, past session row with "Completed" badge, urgent help note |

### Employee — mobile (section "Employee · Mobile", 390px)

| ID | Node | Screen |
| --- | --- | --- |
| M1 | 47:1365 | Sign in (stacked, no side panel) |
| M2 | 47:1427 | Home · not booked (stacked hero, full-width CTA) |
| M3 | 47:1496 | Book a time (sticky bottom bar: selected time + Continue) |
| M4 | 47:1587 | Confirm (sticky bottom: consent checkbox + Confirm) |
| M5 | 47:1675 | Home · booked |
| M6 | 47:1750 | Urgent help bottom sheet |

### Psychologist + admin (section "Luljeta · Psychologist + admin")

| ID | Node | Screen | Must include |
| --- | --- | --- | --- |
| L1 | 45:638 | Schedule | "Good morning, Luljeta", today's count. Today list: time column + rows with avatar, full name, organization, status. Row variants: **needs outcome** (late cancel or no-show: "Give session back" / "Keep as used"); **starts soon** (Join + Cancel); **confirmed** (Cancel). Psychologist cancel uses a confirm dialog. Right column: Urgent messages card (unread count, latest preview, Open) + "Coming up" (next 3 days with counts) |
| L2 | 45:868 | Availability | Weekly hours: per-day toggle, one or more time ranges (30-minute selects), add/remove range, "Copy Monday to all". Booking rules card (read-only text). Time off: list + add (date range + label) + delete. Save / Discard. Changes never touch existing bookings |
| L3 | 45:1321 | Urgent messages | Two panes. List (New/Handled badge, preview, time) and detail (message, phone, email, next session, buttons: Call `tel:`, Send email `mailto:`, Mark as handled). Note: "If someone may be in immediate danger, call 112." Opening a message writes to the audit log |
| L4 | 45:1486 | Organization | Org card (HR contact name and email, status, **Sessions per employee** stepper 1–10, Edit organization). Stats (employees, booked, used). Employee table: name, email, session status badge, remaining, **Give extra session** (confirm dialog; writes `extra +1` and audit). Search + status filter |

Luljeta joins calls through the same `/session/[id]` page (E09) as host.

### HR (section "HR · Organization")

| ID | Node | Screen | Must include |
| --- | --- | --- | --- |
| H1 | 46:1138 | Employees | Top bar with "HR · {Org}" badge. Stats: Invited, Accounts created, Sessions used (k ≥ 5 rule). Neutral privacy note. Search + status filter + **Invite employees**. Table: name, email, access (Active / Invited / Deactivated), invited date, row menu (Resend invite, Deactivate access → confirm dialog; deactivation cancels any future appointment with a refund, and HR is not told whether one existed) |
| H2 | 46:1340 | Invite dialog | Email chips input (paste a list: comma, space or newline separated; validate; dedupe; skip existing). Send N invites. Each invite emails the employee |

---

## 10. Data model (Drizzle, Postgres)

Enable extensions `pgcrypto` and `btree_gist`. All IDs are `uuid default gen_random_uuid()`. All times are `timestamptz`.

```
organizations      id, name, hr_contact_name, hr_contact_email, sessions_per_employee int not null default 1 check (between 0 and 10),
                   status ('active'|'inactive'), created_at
users              id, organization_id (null for psychologist), email citext unique, full_name, password_hash,
                   role ('employee'|'psychologist'|'hr'), is_admin bool default false, locale ('en'|'sq') default 'en',
                   status ('invited'|'active'|'deactivated'), invited_at, activated_at, created_at
invites            id, organization_id, email, token_hash, invited_by, expires_at, accepted_at, created_at
password_resets    id, user_id, token_hash, expires_at, used_at
psychologist_profiles  user_id pk, title, languages text[], bio, photo_url null   -- seed Luljeta
availability_rules id, psychologist_id, weekday smallint (1=Mon..7=Sun), start_time time, end_time time
time_off           id, psychologist_id, starts_at, ends_at, label
appointments       id, employee_id, psychologist_id, organization_id, starts_at, ends_at,
                   status ('confirmed'|'cancelled'|'late_cancelled'|'cancelled_by_psychologist'|'completed'|'no_show'),
                   outcome ('none'|'pending'|'given_back'|'kept') default 'none',
                   cancelled_at, cancelled_by, employee_joined_at, psychologist_joined_at,
                   whereby_meeting_id, whereby_room_url_enc, whereby_host_url_enc,
                   reminder_24h_sent_at, reminder_15m_sent_at, created_at
                   EXCLUDE USING gist (psychologist_id WITH =, tstzrange(starts_at, ends_at, '[)') WITH &&)
                     WHERE (status IN ('confirmed','completed','no_show','late_cancelled'))
                   CHECK (ends_at = starts_at + interval '50 minutes')
                   partial unique index: one future 'confirmed' per employee (enforce in the transaction too)
session_ledger     id, employee_id, amount smallint (-1|+1), reason ('booking'|'refund'|'extra'), appointment_id null,
                   created_by, created_at
consents           id, user_id, version, accepted_at
urgent_messages    id, employee_id, body_enc, phone_enc null, created_at, read_at, handled_at, handled_by
audit_log          id, actor_id, action, entity, entity_id, meta jsonb (no personal data), created_at
sessions / accounts  (Auth.js adapter tables)
```

---

## 11. Video: Whereby Embedded (`lib/video/whereby.ts`)

Verify the details below against https://docs.whereby.com before coding. Use the REST API with a Bearer API key.

- **Create the room lazily.** Do it the first time either participant opens `/session/[id]` inside the join window: `POST /v1/meetings` with `endDate = ends_at`, `roomMode: "normal"`, `isLocked: true`, `roomNamePrefix: "mn-"`, and `fields: ["hostRoomUrl"]`. Store the meeting ID and both URLs encrypted. Rooms are auto-deleted after `endDate`.
- **Employee** gets `roomUrl`; **psychologist** gets `hostRoomUrl`. Add URL params:
  - `displayName` (first name for the employee; "Luljeta" for the psychologist);
  - `externalId=<appointmentId>:<role>`;
  - `lang=en`;
  - turn off chat, recording, screen-share and people list where Whereby allows.
- **Embed** with Whereby's web component (`@whereby.com/browser-sdk` `<whereby-embed>`) or an `<iframe allow="camera; microphone; fullscreen; speaker; display-capture">`. Whereby provides the pre-call camera check, so don't build one.
- **Server check:** `/session/[id]` returns 404 for anyone other than the two participants, and a friendly "Not open yet / This session has ended" page outside the window.
- **Webhook** `POST /api/webhooks/whereby`:
  - Verify the `Whereby-Signature` header: HMAC-SHA256 over `${t}.${rawBody}` with `WHEREBY_WEBHOOK_SECRET`, compared in constant time, rejecting timestamps older than 5 minutes.
  - On `room.client.joined`, use `externalId` to set `employee_joined_at` / `psychologist_joined_at`.
  - Idempotent; respond 200 quickly.
- **No recordings or transcriptions.**
- **Fallback for local dev without a key:** if `WHEREBY_API_KEY` is unset, render a placeholder panel ("Video room appears here") so everything else is testable.

---

## 12. Email and scheduled jobs

Send with Resend from `EMAIL_FROM`. If `RESEND_API_KEY` is unset in dev, log "email queued: <template> to <userId>" instead (never the address or content).

Keep all templates in plain, calm language with the logo and no sensitive details:

| Template | Sent to | Content |
| --- | --- | --- |
| `invite` | Employee | "{Org} has invited you to Mind Nexus" + accept link (14 days) |
| `password-reset` | User | Link (30 minutes) |
| `booking-confirmed` | Employee + Luljeta | Date, time, link to home, `.ics` attachment |
| `reminder-24h`, `reminder-15m` | Employee + Luljeta | "Your session starts at HH:MM" + link |
| `cancelled` | The other party | Date/time; whether the session was returned (employee only) |
| `urgent-alert` | Luljeta (`PSYCHOLOGIST_ALERT_EMAIL`) | "New urgent message from {full name}". No body |
| `extra-session` | Employee | "You have a new session available" |

Vercel Cron (`vercel.json`), each route checking `Authorization: Bearer ${CRON_SECRET}`:
- `*/5 * * * *` → `/api/cron/reminders`: send the 24 h and 15 min reminders not yet sent.
- `*/5 * * * *` → `/api/cron/attendance`:
  - starts_at + 15 min passed and the employee never joined → `no_show` (outcome `pending`);
  - ends_at passed and both joined → `completed`;
  - the employee joined but the psychologist never did → `cancelled_by_psychologist` + refund + flag.

---

## 13. Seed data (`pnpm db:seed`)

| What | Seed |
| --- | --- |
| Organization | "Dardania Group" `TODO(content)`, `sessions_per_employee = 1`, HR contact "Drita Morina" / `drita.morina@example.com` `TODO(content)` |
| Psychologist | Luljeta Berisha, `role=psychologist`, `is_admin=true`, title "Clinical psychologist", languages ["Albanian"], bio `TODO(content)` (placeholder below). Password from env `SEED_PSYCHOLOGIST_PASSWORD` |
| HR user | Drita Morina, `role=hr`, password from `SEED_HR_PASSWORD` |
| Availability `TODO(content)` | Mon 09:00–12:00 and 13:00–17:00; Tue 09:00–12:00; Wed 09:00–12:00 and 13:00–17:00; Thu 10:00–18:00; Fri 09:00–14:00 |
| Employees (dev only, behind `SEED_DEMO=1`) | 3 demo employees: one active, one invited, one with a past completed session |

Placeholder bio: "I help adults manage stress, anxiety and difficult life changes. Our session is a safe, confidential space to talk about what's on your mind and find practical next steps."

---

## 14. Environment variables (`.env.example`)

```
DATABASE_URL=
AUTH_SECRET=
APP_URL=http://localhost:3000
ENCRYPTION_KEY=                 # 32-byte base64
WHEREBY_API_KEY=
WHEREBY_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM="Mind Nexus <no-reply@example.com>"
PSYCHOLOGIST_ALERT_EMAIL=
CRON_SECRET=
SEED_PSYCHOLOGIST_PASSWORD=
SEED_HR_PASSWORD=
SEED_DEMO=0
```

---

## 15. Copy (use exactly; put in `messages/en.json`)

Key strings, taken from Figma:
- "Welcome, {firstName}"
- "Talk to Luljeta, privately"
- "One 50-minute video session, here in Mind Nexus. Your organization covers it and never sees what you discuss."
- "Book your session" · "Choose a time" · "Times in Kosovo time (CET). Each session is 50 minutes."
- "Confirm your session" · "Before your first session":
  - "Sessions happen by video in Mind Nexus and are never recorded."
  - "What you share stays between you and Luljeta, under professional confidentiality."
  - "Your organization only sees anonymous totals, never who booked."
  - "Mind Nexus is not an emergency service. If you're in danger, call 112."
  - Checkbox: "I have read and agree to the informed consent for online sessions."
- "Join session" · "Opens at {time}, 10 minutes before" · "Free cancellation until {weekday} {date}, {time}."
- "Cancel your session?"
- "Urgent help" · "In immediate danger? Call 112" · "Or send an urgent message to Luljeta" · "She'll read it as soon as she can and contact you. Only Luljeta sees this message."
- "Your session is complete" · "Thank you for taking time for yourself. Your plan included one session, which you've now used."
- HR: "You'll never see who books or attends a session. Totals stay hidden until at least 5 sessions are used."

---

## 16. Build order (Friday → Monday)

Each phase ends green (lint, typecheck, tests) and committed.

0. **Scaffold.**
   - Next.js, Tailwind tokens (§8), fonts, shadcn base, `lucide-react`, next-intl, Drizzle + first migration (§10 incl. the exclusion constraint), seed (§13), `.env.example`, logo + favicon.
   - UI primitives: Button, Badge, Avatar, Input, Select, Toggle, StatCard, DayChip, TimeSlot, Note, Dialog, Sheet.
   - Layouts: employee top bar (desktop and mobile), HR top bar, psychologist sidebar.
1. **Auth.** Login (E01/M1), invite accept (E02), forgot/reset (E03/E03b), role redirects, guards, rate limiting, security headers.
2. **Availability + slot engine.** L2 screen, `slots.ts` + all unit tests in §7.
3. **Booking.** Allowance + ledger, E04/E05/E06/E07 (+ mobile M2–M5), consent record, booking transaction, `.ics`, confirmation email, cancel (E08) with the 24 h rule. Unit tests: allowance maths, cancel outcomes.
4. **Psychologist schedule + organization.** L1 (outcome decisions, psychologist cancel), L4 (sessions per employee, give extra session, audit).
5. **HR.** H1 + H2: invites (email chips, dedupe), resend, deactivate (cancels a future appointment silently + refund), k ≥ 5 totals.
6. **Video.** E09, Whereby room creation, host vs participant URLs, join window, webhook, attendance cron, reminders cron.
7. **Urgent help.** E10/M6 dialog and sheet, encrypted storage, alert email, rate limit, L3 inbox with mark-as-handled, audit.
8. **Polish + ship.**
   - E11 state.
   - Mobile pass on all employee screens.
   - Accessibility pass (focus, labels, contrast).
   - One Playwright smoke test: login as employee → book → see booked home → cancel.
   - Deploy to Vercel (`fra1`) with Neon/Supabase EU, set crons, check headers.

**If time runs short, cut in this order:**
1. Add to calendar.
2. The L1 "Coming up" card.
3. Email chips (use a plain textarea).

**Never cut:**
- urgent help;
- the consent step;
- the HR privacy rules;
- the exclusion constraint;
- auth guards.

---

## 17. Out of scope for v1 (do not build)

- Psychologist directory and multiple psychologists
- Rescheduling (cancel and rebook instead)
- General messaging and in-call chat
- Notifications panel
- Account settings page
- Session notes
- Organization session pools
- Usage charts
- Multi-organization admin and organization creation UI (seed it)
- Payments
- Native apps
- Recordings and transcription
- Analytics or tracking scripts

---

## 18. Open items (placeholders until the client confirms)

- [ ] Real organization name and HR contact
- [ ] Luljeta's bio, optional photo, real weekly hours
- [ ] Full informed-consent text and version (reviewed by Luljeta)
- [ ] Join window grace after end: 0 or 10 minutes (`JOIN_GRACE_AFTER_END_MIN`)
- [ ] Whereby, Vercel, database and Resend accounts and keys
- [ ] Domain and email sender DNS
- [ ] Privacy policy and terms pages (link from E02 and the footer)
- [ ] Albanian translations (`messages/sq.json`)
