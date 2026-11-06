import { getTranslations } from 'next-intl/server';
import { Phone } from 'lucide-react';
import { Avatar, Badge, Note } from '@/components/ui/primitives';
import { displayDate, displayTime } from '@/lib/dates';
export async function CompletedHome({ start, end }: { start: Date; end: Date }) {
  const t = await getTranslations();
  return (
    <main className="container completed-home stack" style={{ gap: 24 }}>
      <svg width="240" height="76" viewBox="0 0 240 76" aria-hidden="true">
        <path d="M20 54L70 24L120 54L170 28L220 58" fill="none" stroke="#1A1917" strokeWidth="2" />
        {[
          [20, 54],
          [70, 24],
          [120, 54],
          [170, 28],
          [220, 58],
        ].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="7" fill="#842A14" />
        ))}
      </svg>
      <h1>{t('home.complete')}</h1>
      <p className="muted complete-description">{t('home.completeDescription')}</p>
      <section className="card row full wrap" style={{ textAlign: 'left' }}>
        <Avatar name={t('profile.name')} />
        <div style={{ flex: 1 }}>
          <strong>{t('home.sessionTitle')}</strong>
          <p className="caption">
            {displayDate(start)} · {displayTime(start)}–{displayTime(end)}
          </p>
        </div>
        <Badge tone="success">{t('status.completed')}</Badge>
      </section>
      <Note icon={<Phone />}>{t('home.urgentNote')}</Note>
    </main>
  );
}
