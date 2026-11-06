import type {Metadata} from 'next';
import {Newsreader,Instrument_Sans} from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale,getMessages} from 'next-intl/server';
import './globals.css';
const serif=Newsreader({subsets:['latin'],weight:['400','500'],variable:'--font-newsreader',display:'swap'});
const sans=Instrument_Sans({subsets:['latin'],weight:['400','500','600'],variable:'--font-instrument',display:'swap'});
export const metadata:Metadata={title:{default:'Mind Nexus',template:'%s · Mind Nexus'},description:'Confidential mental-health sessions provided by your organization.',robots:{index:false,follow:false},icons:{icon:'/favicon.svg'}};
export default async function RootLayout({children}:{children:React.ReactNode}){return <html lang={await getLocale()}><body className={`${serif.variable} ${sans.variable}`}><NextIntlClientProvider messages={await getMessages()}>{children}</NextIntlClientProvider></body></html>;}
