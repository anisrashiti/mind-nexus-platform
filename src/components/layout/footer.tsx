import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
export async function Footer() {
  const t = await getTranslations('common');
  return (
    <footer className="footer">
      <span>{t('brand')}</span>
      <Link href="/privacy">{t('privacy')}</Link>
      <Link href="/terms">{t('terms')}</Link>
    </footer>
  );
}
