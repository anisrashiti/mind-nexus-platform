'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight, Clock3 } from 'lucide-react';
import { Button, DayChip, TimeSlot, Note } from '@/components/ui/primitives';
import { localDate, nextDate, weekStart, displayDate, displayTime } from '@/lib/dates';
import { SESSION_MINUTES } from '@/lib/constants';
export function SlotPicker({ slots, today }: { slots: string[]; today: string }) {
  const t = useTranslations('booking');
  const c = useTranslations('common');
  const first = slots[0] ? localDate(new Date(slots[0])) : today;
  const [week, setWeek] = useState(weekStart(first));
  const [day, setDay] = useState(first);
  const [selected, setSelected] = useState('');
  const days = Array.from({ length: 5 }, (_, i) => nextDate(week, i));
  const daySlots = slots.filter((s) => localDate(new Date(s)) === day);
  const group = daySlots.length > 6;
  function navigate(direction: number) {
    const next = nextDate(week, direction * 7);
    setWeek(next);
    const nextSlot = slots.find((s) => {
      const date = localDate(new Date(s));
      return date >= next && date <= nextDate(next, 4);
    });
    setDay(nextSlot ? localDate(new Date(nextSlot)) : next);
    setSelected('');
  }
  const slotGroup = (values: string[], label?: string) =>
    values.length > 0 && (
      <div className="stack" style={{ gap: 12 }}>
        {label && <p className="caption">{label}</p>}
        <div className="slot-grid">
          {values.map((s) => (
            <TimeSlot key={s} aria-pressed={selected === s} onClick={() => setSelected(s)}>
              {displayTime(new Date(s))}
            </TimeSlot>
          ))}
        </div>
      </div>
    );
  if (!slots.length)
    return (
      <section className="card stack booking-panel" style={{ gap: 12 }}>
        <h2 className="book-heading">{t('noTimesTitle')}</h2>
        <p className="muted">{t('noTimesDescription')}</p>
      </section>
    );
  return (
    <section className="card stack booking-panel" style={{ gap: 20 }}>
      <h2 className="book-heading">{t('choose')}</h2>
      <div className="row between">
        <strong>
          {displayDate(new Date(`${week}T12:00Z`), 'd')} –{' '}
          {displayDate(new Date(`${nextDate(week, 4)}T12:00Z`), 'd MMMM yyyy')}
        </strong>
        <div className="row" style={{ gap: 8 }}>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('previousWeek')}
            disabled={week <= weekStart(today)}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('nextWeek')}
            disabled={nextDate(week, 7) > nextDate(today, 28)}
            onClick={() => navigate(1)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="day-grid">
        {days.map((date) => (
          <DayChip
            key={date}
            weekday={displayDate(new Date(`${date}T12:00Z`), 'EEE')}
            date={date.slice(-2).replace(/^0/, '')}
            disabled={!slots.some((s) => localDate(new Date(s)) === date)}
            aria-label={displayDate(new Date(`${date}T12:00Z`))}
            aria-pressed={day === date}
            onClick={() => {
              setDay(date);
              setSelected('');
            }}
          />
        ))}
      </div>
      <div>
        <h3>{displayDate(new Date(`${day}T12:00Z`))}</h3>
        <p className="caption">{t('zone')}</p>
      </div>
      {daySlots.length ? (
        group ? (
          <>
            {slotGroup(
              daySlots.filter((s) => Number(displayTime(new Date(s)).slice(0, 2)) < 12),
              t('morning'),
            )}
            {slotGroup(
              daySlots.filter((s) => Number(displayTime(new Date(s)).slice(0, 2)) >= 12),
              t('afternoon'),
            )}
          </>
        ) : (
          slotGroup(daySlots)
        )
      ) : (
        <p className="muted">{t('noSlots')}</p>
      )}
      <div className="booking-actions stack" style={{ gap: 16 }}>
        <Note icon={<Clock3 />}>
          {selected
            ? `${displayDate(new Date(selected), 'EEE d MMM')} · ${displayTime(new Date(selected))}–${displayTime(new Date(+new Date(selected) + SESSION_MINUTES * 60000))}`
            : t('selectTime')}
        </Note>
        {selected ? (
          <Link
            className="btn btn-primary btn-lg full"
            href={`/book/confirm?start=${encodeURIComponent(selected)}`}
          >
            <ArrowRight />
            {c('continue')}
          </Link>
        ) : (
          <Button size="lg" disabled className="full">
            <ArrowRight />
            {c('continue')}
          </Button>
        )}
      </div>
    </section>
  );
}
