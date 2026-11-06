'use client';
import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Video, Clock3, CalendarDays, Info } from 'lucide-react';
import { Button, Badge, Note } from '@/components/ui/primitives';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';
import { cancelBooking } from '@/lib/booking/actions';
import { displayDate, displayTime } from '@/lib/dates';
import { joinWindow, cancellationOutcome } from '@/lib/booking/rules';
export function BookedSession({
  appointment,
}: {
  appointment: { id: string; startsAt: string; endsAt: string; status: string };
}) {
  const t = useTranslations();
  const start = new Date(appointment.startsAt),
    end = new Date(appointment.endsAt);
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);
  const window = joinWindow(start, end, now);
  const deadline = new Date(+start - 24 * 3600000);
  const free = cancellationOutcome(start, now).refund;
  return (
    <>
      <section className="card hero-card booked-card">
        <div className="date-block">
          <span className="overline">{displayDate(start, 'MMM')}</span>
          <strong>{displayDate(start, 'd')}</strong>
          <span className="overline">{displayDate(start, 'EEE')}</span>
        </div>
        <div className="stack" style={{ gap: 8, flex: 1 }}>
          <Badge tone="success">{t('status.confirmed')}</Badge>
          <h2>{t('home.sessionTitle')}</h2>
          <div className="row muted">
            <Clock3 />
            {displayDate(start)} · {displayTime(start)}–{displayTime(end)}
          </div>
        </div>
        <div className="stack booked-actions" style={{ gap: 8 }}>
          {window === 'open' ? (
            <Link className="btn btn-primary btn-lg full" href={`/session/${appointment.id}`}>
              <Video />
              {t('home.joinSession')}
            </Link>
          ) : (
            <Button size="lg" disabled className="full">
              <Video />
              {t('home.joinSession')}
            </Button>
          )}
          <p className="caption" style={{ textAlign: 'center' }}>
            {window === 'ended'
              ? t('video.ended')
              : t('home.opens', { time: displayTime(new Date(+start - 10 * 60000)) })}
          </p>
          <a className="btn btn-secondary full" href={`/api/calendar/${appointment.id}`} download>
            <CalendarDays />
            {t('home.calendar')}
          </a>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" style={{ color: 'var(--color-text-danger)' }}>
                {t('home.cancel')}
              </Button>
            </DialogTrigger>
            <DialogContent title={t('booking.cancelTitle')}>
              <p className="muted">
                {displayDate(start)} · {displayTime(start)}–{displayTime(end)}
              </p>
              <Note tone={free ? 'success' : 'warning'} icon={<Info />}>
                {t(free ? 'booking.freeCancel' : 'booking.lateCancel')}
              </Note>
              {error && (
                <p role="alert" className="field-error">
                  {t(`booking.${error}`)}
                </p>
              )}
              <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
                <DialogClose asChild>
                  <Button variant="secondary">{t('booking.keep')}</Button>
                </DialogClose>
                <Button
                  variant="danger"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        const result = await cancelBooking({ id: appointment.id });
                        if (result.error) setError(result.error);
                        else {
                          setOpen(false);
                          router.refresh();
                        }
                      } catch {
                        setError('unavailable');
                      }
                    })
                  }
                >
                  {pending ? t('common.pending') : t('home.cancel')}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>
      <Note tone="accent" icon={<Info />}>
        {t('home.deadline', {
          weekday: displayDate(deadline, 'EEEE'),
          date: displayDate(deadline, 'd MMMM'),
          time: displayTime(deadline),
        })}
      </Note>
    </>
  );
}
