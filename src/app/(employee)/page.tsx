import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { eq } from 'drizzle-orm';
import { ArrowRight, CalendarDays, Video, RefreshCw } from 'lucide-react';
import { requireEmployee } from '@/lib/auth/guards';
import { db } from '@/lib/db/client';
import { organizations } from '@/lib/db/schema';
import { employeeBookingState, publicPsychologist } from '@/lib/booking/queries';
import { getAvailableSlots } from '@/lib/booking/slots';
import { localDate, nextDate, displayDate, displayTime } from '@/lib/dates';
import { Avatar, Badge, Note } from '@/components/ui/primitives';
import { BookedSession } from '@/components/booking/booked-session';
import { CompletedHome } from '@/components/booking/completed-home';
export default async function Home() {
  const user = await requireEmployee();
  const t = await getTranslations();
  const [state, profile, [org]] = await Promise.all([
    employeeBookingState(user),
    publicPsychologist(),
    db()
      .select({ name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, user.organizationId!)),
  ]);
  let next: Date | undefined;
  if (!state.appointment && state.remaining > 0 && profile)
    next = (
      await getAvailableSlots(
        profile.id,
        localDate(new Date()),
        nextDate(localDate(new Date()), 28),
      )
    )[0];
  if (!state.appointment && state.remaining <= 0 && state.past?.status === 'completed')
    return <CompletedHome start={state.past.startsAt} end={state.past.endsAt} />;
  return (
    <main className="container stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>{t('home.welcome', { firstName: user.fullName.split(' ')[0] })}</h1>
        <p className="muted">
          {state.appointment
            ? t('home.bookedDescription')
            : t('home.intro', { organization: org.name })}
        </p>
      </div>
      {state.appointment ? (
        <BookedSession
          appointment={{
            ...state.appointment,
            startsAt: state.appointment.startsAt.toISOString(),
            endsAt: state.appointment.endsAt.toISOString(),
          }}
        />
      ) : state.remaining > 0 ? (
        <>
          <section className="card hero-card home-hero">
            <div className="stack" style={{ gap: 16 }}>
              <Badge tone="success">{t('home.available', { count: state.remaining })}</Badge>
              <h2 className="hero-title">{t('home.headline')}</h2>
              <p className="muted" style={{ fontSize: 16, lineHeight: '26px' }}>
                {t('home.description')}
              </p>
              <Link
                className="btn btn-primary btn-lg mobile-full"
                style={{ alignSelf: 'flex-start' }}
                href="/book"
              >
                <ArrowRight />
                {t('home.book')}
              </Link>
            </div>
            <aside className="profile-panel stack" style={{ gap: 12 }}>
              <Avatar name={t('profile.name')} size="lg" />
              <div>
                <h3>{t('profile.name')}</h3>
                <p className="muted">{t('profile.title')}</p>
              </div>
              <Badge>{t('profile.language')}</Badge>
              <hr className="divider" />
              <div>
                <p className="caption">{t('profile.next')}</p>
                <p style={{ color: 'var(--color-text-brand)' }}>
                  {next
                    ? `${displayDate(next, 'EEEE d MMM')}, ${displayTime(next)}`
                    : t('profile.noSlots')}
                </p>
              </div>
            </aside>
          </section>
          <div className="grid-3">
            {[
              ['pick', 'pickDescription', CalendarDays],
              ['join', 'joinDescription', Video],
              ['change', 'changeDescription', RefreshCw],
            ].map(([title, desc, Icon]) => (
              <section className="card stack" style={{ gap: 8 }} key={String(title)}>
                {typeof Icon !== 'string' && <Icon style={{ color: 'var(--color-text-brand)' }} />}
                <h3>{t(`home.${title}`)}</h3>
                <p className="muted">{t(`home.${desc}`)}</p>
              </section>
            ))}
          </div>
        </>
      ) : (
        <section className="card stack empty">
          <h2>
            {t(state.past?.outcome === 'pending' ? 'home.pendingOutcome' : 'home.noAllowance')}
          </h2>
          <p className="muted">
            {t(
              state.past?.outcome === 'pending'
                ? 'home.latePending'
                : 'home.noAllowanceDescription',
            )}
          </p>
        </section>
      )}
      <Note>{t('home.privacy')}</Note>
    </main>
  );
}
