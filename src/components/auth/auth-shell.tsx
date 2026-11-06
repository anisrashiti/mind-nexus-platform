import {Shield,Video,CalendarDays} from 'lucide-react';
import {getTranslations} from 'next-intl/server';
import {Logo} from '@/components/layout/logo';
import {LanguageSwitch} from '@/components/layout/language-switch';
import {Network} from '@/components/layout/network';
import {Note} from '@/components/ui/primitives';
export async function AuthShell({children}:{children:React.ReactNode}){const t=await getTranslations('auth');return <main className="auth-shell"><aside className="auth-panel"><div className="auth-network"><Network dark/></div><Logo href="/login"/><div className="auth-copy stack"><h2>{t('headline')}</h2><p>{t('intro')}</p><div className="stack" style={{gap:12,paddingTop:8}}><div className="row"><Shield/>{t('reassurance1')}</div><div className="row"><Video/>{t('reassurance2')}</div><div className="row"><CalendarDays/>{t('reassurance3')}</div></div></div></aside><section className="auth-main"><div className="auth-desktop-language"><LanguageSwitch/></div><div className="auth-mobile-logo"><Logo href="/login"/></div><div className="auth-form">{children}</div><div className="auth-mobile-language"><LanguageSwitch/></div><div className="auth-mobile-note"><Note>{t('reassurance1')}</Note></div></section></main>;}
