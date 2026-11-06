import Link from 'next/link';
import { and, eq, gte, lt, isNull, count } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Video, MessageSquare, ArrowRight } from 'lucide-react';
import { requirePsychologist } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { appointments, users, organizations, urgentMessages } from '@/lib/db/schema';
import { localDate, localInstant, nextDate, displayDate, displayTime } from '@/lib/dates';
import { joinWindow } from '@/lib/booking/rules';
import { Avatar, Badge, Note } from '@/components/ui/primitives';
import { OutcomeActions, PsychologistCancel } from '@/components/psychologist/session-actions';
import { urgentSummary } from '@/lib/urgent/queries';
export default async function Schedule() {
  const actor = await requirePsychologist();
  const t = await getTranslations();
  const now = new Date(),
    today = localDate(now);
  const projection = {
    id: appointments.id,
    fullName: users.fullName,
    organization: organizations.name,
    startsAt: appointments.startsAt,
    endsAt: appointments.endsAt,
    status: appointments.status,
    outcome: appointments.outcome,
    employeeJoinedAt: appointments.employeeJoinedAt,
    psychologistJoinedAt: appointments.psychologistJoinedAt,
  };
  const base = () =>
    db()
      .select(projection)
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.employeeId))
      .innerJoin(organizations, eq(organizations.id, appointments.organizationId));
  const [rows, pending, coming, [unread]] = await Promise.all([
    base()
      .where(
        and(
          eq(appointments.psychologistId, actor.id),
          gte(appointments.startsAt, localInstant(today)),
          lt(appointments.startsAt, localInstant(nextDate(today))),
        ),
      )
      .orderBy(appointments.startsAt),
    base()
      .where(
        and(
          eq(appointments.psychologistId, actor.id),
          eq(appointments.outcome, 'pending'),
          lt(appointments.startsAt, localInstant(today)),
        ),
      )
      .orderBy(appointments.startsAt),
    db()
      .select({ startsAt: appointments.startsAt })
      .from(appointments)
      .where(
        and(
          eq(appointments.psychologistId, actor.id),
          eq(appointments.status, 'confirmed'),
          gte(appointments.startsAt, localInstant(nextDate(today))),
          lt(appointments.startsAt, localInstant(nextDate(today, 4))),
        ),
      ),
    db().select({ count: count() }).from(urgentMessages).where(isNull(urgentMessages.readAt)),
  ]);
  const summary = await urgentSummary(actor.id);
  const renderRow = (row: (typeof rows)[number]) => (
    <div className="schedule-row" key={row.id}>
      <div style={{ paddingTop: 12 }}>
        <strong>{displayTime(row.startsAt)}</strong>
        <p className="caption">{t('psychologist.minutes')}</p>
      </div>
      <div
        className={`schedule-session stack ${row.outcome === 'pending' ? 'needs-outcome' : ''}`}
        style={{ gap: 12 }}
      >
        <div className="row wrap">
          <Avatar name={row.fullName} size="sm" />
          <div style={{ flex: 1 }}>
            <strong>{row.fullName}</strong>
            <p className="caption">{row.organization}</p>
          </div>
          <Badge
            tone={
              row.outcome === 'pending'
                ? 'warning'
                : row.status === 'confirmed' || row.status === 'completed'
                  ? 'success'
                  : 'neutral'
            }
          >
            {t(`status.${row.status}`)}
          </Badge>
          {row.status === 'confirmed' && row.endsAt > now && (
            <>
              <PsychologistCancel id={row.id} />
              {joinWindow(row.startsAt, row.endsAt, now) === 'open' && (
                <Link href={`/session/${row.id}`} className="btn btn-primary">
                  <Video />
                  {t('psychologist.join')}
                </Link>
              )}
            </>
          )}
        </div>
        {row.outcome === 'pending' && <OutcomeActions id={row.id} />}{' '}
        {row.status === 'cancelled_by_psychologist' &&
          row.employeeJoinedAt &&
          !row.psychologistJoinedAt && <Note tone="warning">{t('psychologist.missed')}</Note>}
      </div>
    </div>
  );
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>{t('psychologist.greeting')}</h1>
        <p className="muted">
          {t('psychologist.todayCount', {
            date: displayDate(now),
            count: rows.filter((r) => r.status === 'confirmed').length,
          })}
        </p>
      </div>
      <div className="schedule-layout">
        <div className="stack">
          <section className="card stack">
            <div className="row between">
              <h3>{t('psychologist.today')}</h3>
              <span className="caption">{t('common.timeZone')}</span>
            </div>
            {rows.length ? (
              rows.map(renderRow)
            ) : (
              <p className="muted">{t('psychologist.noSessions')}</p>
            )}
            <p className="caption">{t('psychologist.attendance')}</p>
          </section>
          {pending.length > 0 && (
            <section className="card stack">
              <h2>{t('psychologist.outcomes')}</h2>
              {pending.map(renderRow)}
            </section>
          )}
        </div>
        <aside className="stack">
          <section className="card stack" style={{ background: 'var(--color-bg-danger-subtle)' }}>
            <div className="row between">
              <div className="row" style={{ color: 'var(--color-text-danger)' }}>
                <MessageSquare />
                <h3>{t('psychologist.urgent')}</h3>
              </div>
              <Badge tone="danger">{t('psychologist.unread', { count: unread.count })}</Badge>
            </div>
            {summary ? (
              <div className="stack" style={{ gap: 8 }}>
                <strong>{summary.name}</strong>
                <p className="muted" style={{ overflowWrap: 'anywhere' }}>
                  {summary.preview}
                </p>
              </div>
            ) : (
              <p className="muted">{t('psychologist.noUrgent')}</p>
            )}
            <Link className="btn btn-secondary" href="/psychologist/urgent">
              <ArrowRight />
              {t('psychologist.openMessage')}
            </Link>
          </section>
          <section className="card stack">
            <h3>{t('psychologist.coming')}</h3>
            {[1, 2, 3].map((i) => {
              const day = nextDate(today, i);
              return (
                <div className="row between" key={day}>
                  <span className="muted">{displayDate(localInstant(day), 'EEE d MMM')}</span>
                  <strong>
                    {t('psychologist.sessions', {
                      count: coming.filter((a) => localDate(a.startsAt) === day).length,
                    })}
                  </strong>
                </div>
              );
            })}
          </section>
        </aside>
      </div>
    </div>
  );
}
