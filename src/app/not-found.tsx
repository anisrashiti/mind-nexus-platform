import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <main className="container narrow stack">
      <h1>{t('notFound')}</h1>
      <Link href="/" className="btn btn-primary">
        {t('goHome')}
      </Link>
    </main>
  );
}
