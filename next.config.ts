import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';
const config: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  serverExternalPackages: ['argon2', 'postgres'],
};
export default createNextIntlPlugin('./src/i18n/request.ts')(config);
