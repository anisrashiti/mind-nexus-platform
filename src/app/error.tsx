'use client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/primitives';
export default function ErrorPage({ reset }: { reset: () => void }) {
  const t = useTranslations('common');
  return (
    <main className="container narrow stack">
      <h1>{t('error')}</h1>
      <Button onClick={reset}>{t('tryAgain')}</Button>
    </main>
  );
}
