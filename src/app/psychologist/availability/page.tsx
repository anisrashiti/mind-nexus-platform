import {eq} from 'drizzle-orm';
import {getTranslations} from 'next-intl/server';
import {requirePsychologist} from '@/lib/auth/guards';
import {db} from '@/lib/db/client';
import {availabilityRules,timeOff} from '@/lib/db/schema';
import {AvailabilityEditor} from '@/components/psychologist/availability-editor';
export default async function Availability(){const user=await requirePsychologist();const t=await getTranslations();const [rules,off]=await Promise.all([db().select({weekday:availabilityRules.weekday,startTime:availabilityRules.startTime,endTime:availabilityRules.endTime}).from(availabilityRules).where(eq(availabilityRules.psychologistId,user.id)),db().select().from(timeOff).where(eq(timeOff.psychologistId,user.id))]);return <div className="stack" style={{gap:24}}><div className="stack" style={{gap:8}}><h1>{t('psychologist.availability')}</h1><p className="muted">{t('availability.description')}</p></div><AvailabilityEditor initialRules={rules.map(r=>({...r,startTime:r.startTime.slice(0,5),endTime:r.endTime.slice(0,5)}))} initialTimeOff={off.map(o=>({startsAt:o.startsAt.toISOString(),endsAt:o.endsAt.toISOString(),label:o.label}))}/></div>;}
