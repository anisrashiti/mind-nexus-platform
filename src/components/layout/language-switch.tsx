'use client';
import {useLocale,useTranslations} from 'next-intl';
import {useRouter} from 'next/navigation';
export function LanguageSwitch(){const locale=useLocale();const t=useTranslations('common');const router=useRouter();return <div className="language" role="group" aria-label={t('language')}>{(['en','sq'] as const).map(value=><button key={value} type="button" aria-pressed={locale===value} onClick={()=>{document.cookie=`locale=${value}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol==='https:'?'; Secure':''}`;router.refresh();}}>{t(value)}</button>)}</div>;}
