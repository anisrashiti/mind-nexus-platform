import 'server-only';
import { getTranslations } from 'next-intl/server';
import { inArray } from 'drizzle-orm';
import { CalendarDays, CheckCircle2, HeartHandshake, Building2, Users } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { Badge, Note } from '@/components/ui/primitives';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { requireDemoMode, hasDemoAccess } from './access';
import { isDemoDatabase } from './isolation';
import { DEMO_VIEWS, DEMO_VIEW_KEYS } from './config';
import { DemoAccessForm, DemoResetButton, DemoViewButton } from './forms';
import styles from './demo.module.css';

const icons = {
  available: HeartHandshake,
  booked: CalendarDays,
  used: CheckCircle2,
  psychologist: Users,
  hr: Building2,
};
export default async function DemoPage() {
  requireDemoMode();
  const t = await getTranslations('demo');
  const unlocked = await hasDemoAccess();
  let ready: string[] = [];
  let safe = false;
  if (unlocked) {
    try {
      safe = await isDemoDatabase();
      if (safe)
        ready = (
          await db()
            .select({ id: users.id })
            .from(users)
            .where(
              inArray(
                users.id,
                DEMO_VIEW_KEYS.map((key) => DEMO_VIEWS[key].id),
              ),
            )
        ).map((u) => u.id);
    } catch {
      safe = false;
    }
  }
  return (
    <main className={`container stack ${styles.page}`}>
      <Logo href="/demo" />
      <div className="stack" style={{ gap: 12 }}>
        <Badge tone="neutral">{t('mode')}</Badge>
        <h1>{t(unlocked ? 'title' : 'lockedTitle')}</h1>
        <p className="muted">{t(unlocked ? 'description' : 'lockedDescription')}</p>
      </div>
      {!unlocked ? (
        <section className={`card stack ${styles.access}`}>
          <DemoAccessForm />
        </section>
      ) : (
        <>
          <Note>{t('sampleNote')}</Note>
          {!safe && <Note tone="warning">{t('unavailable')}</Note>}
          {safe && ready.length < DEMO_VIEW_KEYS.length && (
            <Note tone="accent">{t('notReady')}</Note>
          )}
          <div className={styles.views}>
            {DEMO_VIEW_KEYS.map((view) => {
              const Icon = icons[view];
              return (
                <section className="card stack" key={view}>
                  <Icon aria-hidden="true" style={{ color: 'var(--color-text-brand)' }} />
                  <h2>{t(`views.${view}.title`)}</h2>
                  <p className="muted">{t(`views.${view}.description`)}</p>
                  <DemoViewButton view={view} disabled={!ready.includes(DEMO_VIEWS[view].id)} />
                </section>
              );
            })}
          </div>
          <div className="row wrap between">
            <p className="caption">{t('resetHint')}</p>
            <DemoResetButton disabled={!safe} />
          </div>
        </>
      )}
    </main>
  );
}
