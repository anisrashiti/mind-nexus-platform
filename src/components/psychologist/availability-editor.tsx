'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Plus, Trash2, Copy, CalendarDays } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { Button, Note, Input } from '@/components/ui/primitives';
import { Toggle } from '@/components/ui/controls';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Toast } from '@/components/ui/toast';
import type { AvailabilityRule } from '@/lib/booking/slot-engine';
import { saveAvailability } from '@/lib/availability/actions';
import { localInstant, nextDate } from '@/lib/dates';
type Off = { startsAt: string; endsAt: string; label: string };
const clocks = Array.from(
  { length: 48 },
  (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
);
export function AvailabilityEditor({
  initialRules,
  initialTimeOff,
}: {
  initialRules: AvailabilityRule[];
  initialTimeOff: Off[];
}) {
  const t = useTranslations('availability');
  const c = useTranslations('common');
  const [rules, setRules] = useState(initialRules);
  const [off, setOff] = useState(initialTimeOff);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(false);
  const [open, setOpen] = useState(false);
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const setDay = (weekday: number, values: AvailabilityRule[]) =>
    setRules((prev) => [...prev.filter((r) => r.weekday !== weekday), ...values]);
  const save = () => {
    setError('');
    startTransition(async () => {
      try {
        const result = await saveAvailability({ rules, timeOff: off });
        if (result.error) setError(t(result.error));
        else setToast(true);
      } catch {
        setError(c('error'));
      }
    });
  };
  return (
    <>
      <div className="availability-layout">
        <section className="card stack">
          <div className="row between wrap">
            <div>
              <h2>{t('weekly')}</h2>
              <p className="caption">{c('timeZone')}</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                const monday = rules.filter((r) => r.weekday === 1);
                setRules(days.flatMap((_, i) => monday.map((r) => ({ ...r, weekday: i + 1 }))));
              }}
            >
              <Copy />
              {t('copy')}
            </Button>
          </div>
          {days.map((day, i) => {
            const weekday = i + 1;
            const dayRules = rules.filter((r) => r.weekday === weekday);
            return (
              <div className="availability-day" key={day}>
                <div className="row">
                  <Toggle
                    aria-label={t('enabled', { day: t(day) })}
                    checked={!!dayRules.length}
                    onCheckedChange={(on) =>
                      setDay(weekday, on ? [{ weekday, startTime: '09:00', endTime: '17:00' }] : [])
                    }
                  />
                  <span>{t(day)}</span>
                </div>
                <div className="stack" style={{ gap: 8 }}>
                  {!dayRules.length && <span className="caption">{t('off')}</span>}
                  {dayRules.map((rule, index) => (
                    <div className="row" key={index} style={{ gap: 8 }}>
                      <label className="sr-only" htmlFor={`start-${weekday}-${index}`}>
                        {t('start')}
                      </label>
                      <select
                        id={`start-${weekday}-${index}`}
                        className="input"
                        value={rule.startTime}
                        onChange={(e) =>
                          setDay(
                            weekday,
                            dayRules.map((r, j) =>
                              j === index ? { ...r, startTime: e.target.value } : r,
                            ),
                          )
                        }
                      >
                        {clocks.map((clock) => (
                          <option key={clock}>{clock}</option>
                        ))}
                      </select>
                      <span aria-hidden="true">–</span>
                      <label className="sr-only" htmlFor={`end-${weekday}-${index}`}>
                        {t('end')}
                      </label>
                      <select
                        id={`end-${weekday}-${index}`}
                        className="input"
                        value={rule.endTime}
                        onChange={(e) =>
                          setDay(
                            weekday,
                            dayRules.map((r, j) =>
                              j === index ? { ...r, endTime: e.target.value } : r,
                            ),
                          )
                        }
                      >
                        {clocks.map((clock) => (
                          <option key={clock}>{clock}</option>
                        ))}
                      </select>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t('removeRange')}
                        onClick={() =>
                          setDay(
                            weekday,
                            dayRules.filter((_, j) => index !== j),
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                </div>
                {!!dayRules.length && (
                  <Button
                    variant="ghost"
                    aria-label={`${t('addRange')} ${t(day)}`}
                    onClick={() =>
                      setDay(weekday, [
                        ...dayRules,
                        { weekday, startTime: '13:00', endTime: '17:00' },
                      ])
                    }
                  >
                    <Plus />
                    {t('addRange')}
                  </Button>
                )}
              </div>
            );
          })}
        </section>
        <div className="stack">
          <section className="card stack">
            <h2>{t('rules')}</h2>
            {[1, 2, 3, 4].map((i) => (
              <div className="row" style={{ alignItems: 'flex-start' }} key={i}>
                <Check style={{ color: 'var(--color-text-brand)' }} />
                <p className="muted">{t(`rule${i}`)}</p>
              </div>
            ))}
          </section>
          <section className="card stack">
            <h2>{t('timeOff')}</h2>
            {!off.length && <p className="muted">{t('none')}</p>}
            {off.map((range, index) => (
              <div className="row" key={index}>
                <CalendarDays />
                <div style={{ flex: 1 }}>
                  <p>
                    {formatInTimeZone(range.startsAt, 'Europe/Belgrade', 'd MMM')} –{' '}
                    {formatInTimeZone(
                      new Date(+new Date(range.endsAt) - 1),
                      'Europe/Belgrade',
                      'd MMM yyyy',
                    )}
                  </p>
                  <p className="caption">{range.label}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t('delete')}
                  onClick={() => setOff((prev) => prev.filter((_, i) => index !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="full">
                  <Plus />
                  {t('addTimeOff')}
                </Button>
              </DialogTrigger>
              <DialogContent title={t('addTimeOff')}>
                <form
                  className="stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    const from = String(form.get('from')),
                      to = String(form.get('to'));
                    if (to < from) {
                      setError(t('invalidRange'));
                      return;
                    }
                    setOff((prev) => [
                      ...prev,
                      {
                        startsAt: localInstant(from).toISOString(),
                        endsAt: localInstant(nextDate(to)).toISOString(),
                        label: String(form.get('label')),
                      },
                    ]);
                    setOpen(false);
                  }}
                >
                  <Input label={t('from')} name="from" type="date" required />
                  <Input label={t('to')} name="to" type="date" required />
                  <Input label={t('label')} name="label" maxLength={120} required />
                  <div className="row" style={{ justifyContent: 'flex-end' }}>
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        {c('cancel')}
                      </Button>
                    </DialogClose>
                    <Button>{t('addTimeOff')}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </section>
        </div>
      </div>
      {error && (
        <div role="alert">
          <Note tone="danger">{error}</Note>
        </div>
      )}
      <div className="row" style={{ justifyContent: 'flex-end' }}>
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            setRules(initialRules);
            setOff(initialTimeOff);
            setError('');
          }}
        >
          {c('discard')}
        </Button>
        <Button disabled={pending} onClick={save}>
          <Check />
          {pending ? c('pending') : c('save')}
        </Button>
      </div>
      <Toast message={t('saved')} open={toast} onOpenChange={setToast} />
    </>
  );
}
