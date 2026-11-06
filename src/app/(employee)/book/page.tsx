import Link from 'next/link';
import {getTranslations} from 'next-intl/server';
import {ChevronLeft,Video,CalendarDays,Shield} from 'lucide-react';
import {requireEmployee} from '@/lib/auth/guards';
import {requireBookable,publicPsychologist} from '@/lib/booking/queries';
import {getAvailableSlots} from '@/lib/booking/slots';
import {localDate,nextDate} from '@/lib/dates';
import {Avatar,Badge} from '@/components/ui/primitives';
import {SlotPicker} from '@/components/booking/slot-picker';
export default async function Book(){const user=await requireEmployee();await requireBookable(user);const profile=await publicPsychologist();const t=await getTranslations();const now=new Date();const slots=profile?await getAvailableSlots(profile.id,localDate(now),nextDate(localDate(now),28),now):[];return <main className="container stack" style={{gap:24}}><Link className="row" href="/"><ChevronLeft/>{t('booking.home')}</Link><div className="grid-2 book-layout"><section className="card hero-card stack book-profile"><div className="row"><Avatar name={t('profile.name')} size="lg"/><div className="stack" style={{gap:8}}><h1>{t('profile.name')}</h1><p className="muted">{t('profile.title')}</p><Badge>{t('profile.language')}</Badge></div></div><hr className="divider"/><div className="stack" style={{gap:8}}><h3>{t('profile.about')}</h3><p className="muted">{profile?.bio??t('profile.bio')}</p></div><h3>{t('profile.session')}</h3>{[[Video,'video'],[CalendarDays,'cancellation'],[Shield,'privacy']].map(([Icon,key])=><div className="row" key={String(key)}>{typeof Icon!=='string'&&<Icon style={{color:'var(--color-text-brand)'}}/>}<p>{t(`profile.${key}`)}</p></div>)}</section><SlotPicker slots={slots.map(s=>s.toISOString())} today={localDate(now)}/></div></main>;}
