import Link from 'next/link';
import Image from 'next/image';
import {getTranslations} from 'next-intl/server';
export async function Logo({href='/'}:{href?:string}){const t=await getTranslations('common');return <Link className="logo" href={href}><Image src="/logo-mark.svg" alt="" width={32} height={32}/><span>{t('brand')}</span></Link>;}
