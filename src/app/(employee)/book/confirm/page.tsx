import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { ChevronLeft, Info } from 'lucide-react';
import { requireEmployee } from '@/lib/auth/guards';
import { requireBookable, publicPsychologist } from '@/lib/booking/queries';
import { getAvailableSlots } from '@/lib/booking/slots';
import { localDate, displayDate, displayTime } from '@/lib/dates';
import { SESSION_MINUTES } from '@/lib/constants';
import { Avatar, Note } from '@/components/ui/primitives';
import { ConfirmForm } from '@/components/booking/confirm-form';
export default async function Confirm({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const user = await requireEmployee();
  await requireBookable(user);
  const t = await getTranslations();
  const params = await searchParams;
  const valid = z.iso.datetime().safeParse(params.start);
  const start = valid.success ? new Date(valid.data) : null;
  const profile = await publicPsychologist();
  const available = !!(
    profile &&
    start &&
    (await getAvailableSlots(profile.id, localDate(start), localDate(start))).some(
      (s) => +s === +start,
    )
  );
  if (!start || !available)
    return (
      <main className="container narrow stack">
        <Note tone="warning">{t('booking.unavailable')}</Note>
        <Link href="/book" className="btn btn-primary">
          {t('booking.choose')}
        </Link>
      </main>
    );
  const deadline = new Date(+start - 24 * 3600000);
  return (
    <main className="container narrow stack" style={{ gap: 24 }}>
      <Link href="/book" className="row">
        <ChevronLeft />
        {t('common.back')}
      </Link>
      <h1>{t('booking.confirmTitle')}</h1>
      <section className="card stack">
        <div className="row">
          <Avatar name={t('profile.name')} />
          <div>
            <h3>{t('profile.name')}</h3>
            <p className="caption">{t('profile.title')}</p>
          </div>
        </div>
        <hr className="divider" />
        <dl className="detail-list">
          <dt>{t('booking.date')}</dt>
          <dd>{displayDate(start, 'EEEE, d MMMM yyyy')}</dd>
          <dt>{t('booking.time')}</dt>
          <dd>
            {displayTime(start)}–{displayTime(new Date(+start + SESSION_MINUTES * 60000))}
          </dd>
          <dt>{t('booking.where')}</dt>
          <dd>{t('booking.whereValue')}</dd>
        </dl>
        <Note tone="accent" icon={<Info />}>
          {t('home.deadline', {
            weekday: displayDate(deadline, 'EEE'),
            date: displayDate(deadline, 'd MMM'),
            time: displayTime(deadline),
          })}
        </Note>
      </section>
      <ConfirmForm start={start.toISOString()} />
    </main>
  );
}
