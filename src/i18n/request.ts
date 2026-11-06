import {getRequestConfig} from 'next-intl/server';
import {cookies} from 'next/headers';
import en from '../../messages/en.json';
import sq from '../../messages/sq.json';
export default getRequestConfig(async()=>{const locale=(await cookies()).get('locale')?.value==='sq'?'sq':'en';return {locale,messages:{...en,...(locale==='sq'?sq:{})},timeZone:'Europe/Belgrade'};});
