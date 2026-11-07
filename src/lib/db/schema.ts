import { sql } from 'drizzle-orm';
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  timestamp,
  time,
  jsonb,
  primaryKey,
  uniqueIndex,
  check,
  customType,
  foreignKey,
} from 'drizzle-orm/pg-core';
const citext = customType<{ data: string }>({ dataType: () => 'citext' });
const id = () => uuid('id').defaultRandom().primaryKey();
const stamp = (name: string) => timestamp(name, { withTimezone: true, mode: 'date' });
const created = () => stamp('created_at').notNull().defaultNow();
export const roles = pgEnum('role', ['employee', 'psychologist', 'hr']);
export const locales = pgEnum('locale', ['en', 'sq']);
export const accessStatuses = pgEnum('access_status', ['invited', 'active', 'deactivated']);
export const orgStatuses = pgEnum('organization_status', ['active', 'inactive']);
export const appointmentStatuses = pgEnum('appointment_status', [
  'confirmed',
  'cancelled',
  'late_cancelled',
  'cancelled_by_psychologist',
  'completed',
  'no_show',
]);
export const outcomes = pgEnum('outcome', ['none', 'pending', 'given_back', 'kept']);
export const ledgerReasons = pgEnum('ledger_reason', ['booking', 'refund', 'extra']);
export const organizations = pgTable(
  'organizations',
  {
    id: id(),
    name: text('name').notNull(),
    hrContactName: text('hr_contact_name').notNull(),
    hrContactEmail: citext('hr_contact_email').notNull(),
    sessionsPerEmployee: integer('sessions_per_employee').notNull().default(1),
    status: orgStatuses('status').notNull().default('active'),
    createdAt: created(),
  },
  (t) => [check('sessions_per_employee_bounds', sql`${t.sessionsPerEmployee} between 0 and 10`)],
);
export const users = pgTable(
  'users',
  {
    id: id(),
    organizationId: uuid('organization_id').references(() => organizations.id),
    email: citext('email').notNull().unique(),
    fullName: text('full_name').notNull(),
    passwordHash: text('password_hash'),
    role: roles('role').notNull(),
    isAdmin: boolean('is_admin').notNull().default(false),
    locale: locales('locale').notNull().default('en'),
    status: accessStatuses('status').notNull().default('invited'),
    invitedAt: stamp('invited_at'),
    activatedAt: stamp('activated_at'),
    createdAt: created(),
  },
  (t) => [
    uniqueIndex('user_organization_key').on(t.id, t.organizationId),
    check(
      'role_organization',
      sql`(${t.role} = 'psychologist' and ${t.organizationId} is null) or (${t.role} <> 'psychologist' and ${t.organizationId} is not null)`,
    ),
  ],
);
export const invites = pgTable('invites', {
  id: id(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id),
  email: citext('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id),
  expiresAt: stamp('expires_at').notNull(),
  acceptedAt: stamp('accepted_at'),
  createdAt: created(),
});
export const passwordResets = pgTable('password_resets', {
  id: id(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: stamp('expires_at').notNull(),
  usedAt: stamp('used_at'),
});
export const psychologistProfiles = pgTable('psychologist_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .references(() => users.id),
  title: text('title').notNull(),
  languages: text('languages').array().notNull(),
  bio: text('bio').notNull(),
  photoUrl: text('photo_url'),
});
export const availabilityRules = pgTable(
  'availability_rules',
  {
    id: id(),
    psychologistId: uuid('psychologist_id')
      .notNull()
      .references(() => users.id),
    weekday: smallint('weekday').notNull(),
    startTime: time('start_time').notNull(),
    endTime: time('end_time').notNull(),
  },
  (t) => [
    check('weekday_bounds', sql`${t.weekday} between 1 and 7`),
    check('valid_availability_range', sql`${t.startTime} < ${t.endTime}`),
    check(
      'availability_grid',
      sql`extract(minute from ${t.startTime}) in (0,30) and extract(second from ${t.startTime}) = 0 and extract(minute from ${t.endTime}) in (0,30) and extract(second from ${t.endTime}) = 0`,
    ),
  ],
);
export const timeOff = pgTable(
  'time_off',
  {
    id: id(),
    psychologistId: uuid('psychologist_id')
      .notNull()
      .references(() => users.id),
    startsAt: stamp('starts_at').notNull(),
    endsAt: stamp('ends_at').notNull(),
    label: text('label').notNull(),
  },
  (t) => [check('valid_time_off', sql`${t.endsAt} > ${t.startsAt}`)],
);
export const appointments = pgTable(
  'appointments',
  {
    id: id(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => users.id),
    psychologistId: uuid('psychologist_id')
      .notNull()
      .references(() => users.id),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id),
    startsAt: stamp('starts_at').notNull(),
    endsAt: stamp('ends_at').notNull(),
    status: appointmentStatuses('status').notNull().default('confirmed'),
    outcome: outcomes('outcome').notNull().default('none'),
    cancelledAt: stamp('cancelled_at'),
    cancelledBy: uuid('cancelled_by').references(() => users.id),
    employeeJoinedAt: stamp('employee_joined_at'),
    psychologistJoinedAt: stamp('psychologist_joined_at'),
    wherebyMeetingId: text('whereby_meeting_id'),
    wherebyRoomUrlEnc: text('whereby_room_url_enc'),
    wherebyHostUrlEnc: text('whereby_host_url_enc'),
    reminder24hSentAt: stamp('reminder_24h_sent_at'),
    reminder15mSentAt: stamp('reminder_15m_sent_at'),
    createdAt: created(),
  },
  (t) => [
    check('appointment_fifty_minutes', sql`${t.endsAt} = ${t.startsAt} + interval '50 minutes'`),
    // TODO(question): Postgres index predicates cannot contain now(). Expired confirmed rows are settled under the employee lock before booking.
    uniqueIndex('one_confirmed_per_employee')
      .on(t.employeeId)
      .where(sql`${t.status} = 'confirmed'`),
    foreignKey({
      columns: [t.employeeId, t.organizationId],
      foreignColumns: [users.id, users.organizationId],
      name: 'appointment_employee_organization_fk',
    }),
  ],
);
export const sessionLedger = pgTable(
  'session_ledger',
  {
    id: id(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => users.id),
    amount: smallint('amount').notNull(),
    reason: ledgerReasons('reason').notNull(),
    appointmentId: uuid('appointment_id').references(() => appointments.id),
    createdBy: uuid('created_by').references(() => users.id),
    createdAt: created(),
  },
  (t) => [
    check(
      'ledger_amount',
      sql`(${t.reason} = 'booking' and ${t.amount} = -1 and ${t.appointmentId} is not null) or (${t.reason} = 'refund' and ${t.amount} = 1 and ${t.appointmentId} is not null) or (${t.reason} = 'extra' and ${t.amount} = 1 and ${t.appointmentId} is null)`,
    ),
    uniqueIndex('appointment_ledger_reason_once')
      .on(t.appointmentId, t.reason)
      .where(sql`${t.appointmentId} is not null`),
  ],
);
export const consents = pgTable(
  'consents',
  {
    id: id(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    version: text('version').notNull(),
    acceptedAt: stamp('accepted_at').notNull().defaultNow(),
  },
  (t) => [uniqueIndex('one_consent_version').on(t.userId, t.version)],
);
export const urgentMessages = pgTable('urgent_messages', {
  id: id(),
  employeeId: uuid('employee_id')
    .notNull()
    .references(() => users.id),
  bodyEnc: text('body_enc').notNull(),
  phoneEnc: text('phone_enc'),
  createdAt: created(),
  readAt: stamp('read_at'),
  handledAt: stamp('handled_at'),
  handledBy: uuid('handled_by').references(() => users.id),
});
export const auditLog = pgTable('audit_log', {
  id: id(),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: uuid('entity_id').notNull(),
  meta: jsonb('meta').$type<Record<string, string | number | boolean>>(),
  createdAt: created(),
});
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  expires: stamp('expires').notNull(),
});
export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);
// Durable atomic counters; keys are HMACs, never raw addresses or IPs.
export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetsAt: stamp('resets_at').notNull(),
});
export type User = typeof users.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
