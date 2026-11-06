import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Logo } from '@/components/layout/logo';
import { Footer } from '@/components/layout/footer';
import { Note } from '@/components/ui/primitives';
export default async function Legal({ params }: { params: Promise<{ document: string }> }) {
  const { document } = await params;
  if (!['privacy', 'terms', 'consent'].includes(document)) notFound();
  const t = await getTranslations();
  return (
    <>
      <header className="topbar">
        <Logo href="/login" />
      </header>
      <main className="container narrow stack">
        <h1>{t(`common.${document}`)}</h1>
        <Note>{t('legal.draft')}</Note>
        <p>{t(`legal.${document}Draft`)}</p>
        {document === 'consent' && (
          <ul>
            {[1, 2, 3, 4].map((n) => (
              <li key={n}>{t(`booking.bullet${n}`)}</li>
            ))}
          </ul>
        )}
      </main>
      <Footer />
    </>
  );
}
