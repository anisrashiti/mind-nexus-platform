import 'server-only';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { currentUser } from '@/lib/auth/guards';
import { demoEnabled } from './config';
import { hasDemoAccess } from './access';
import { DemoResetButton } from './forms';
import styles from './demo.module.css';

export async function DemoBanner() {
  if (!demoEnabled()) return null;
  const t = await getTranslations('demo');
  const [user, unlocked] = await Promise.all([currentUser(), hasDemoAccess()]);
  return (
    <aside className={styles.banner} aria-label={t('mode')}>
      <span>{t('banner', { role: t(`roles.${user?.role ?? 'visitor'}`) })}</span>
      <nav className={styles.bannerActions} aria-label={t('controls')}>
        <Link href="/demo">{t('switch')}</Link>
        <DemoResetButton disabled={!unlocked} />
      </nav>
    </aside>
  );
}
