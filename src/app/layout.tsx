import type { Metadata } from 'next';
import { Newsreader, Instrument_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import sq from '../../messages/sq.json';
import './globals.css';
const serif = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-newsreader',
  display: 'swap',
});
const sans = Instrument_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-instrument',
  display: 'swap',
});
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('common');
  return {
    title: { default: t('brand'), template: `%s · ${t('brand')}` },
    description: t('description'),
    robots: { index: false, follow: false },
    icons: { icon: '/favicon.svg' },
  };
}
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale === 'sq' && Object.keys(sq).length === 0 ? 'en' : locale}>
      <body className={`${serif.variable} ${sans.variable}`}>
        <NextIntlClientProvider messages={await getMessages()}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
