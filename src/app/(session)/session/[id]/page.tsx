import {notFound} from 'next/navigation';
import {eq} from 'drizzle-orm';
import {z} from 'zod';
import {getTranslations} from 'next-intl/server';
import Link from 'next/link';
import {LockKeyhole} from 'lucide-react';
import {requireUser} from '@/lib/auth/guards';
import {db} from '@/lib/db/client';
import {appointments,users} from '@/lib/db/schema';
import {joinWindow} from '@/lib/booking/rules';
import {displayTime} from '@/lib/dates';
import {ensureVideoRoom} from '@/lib/video/whereby';
import {Logo} from '@/components/layout/logo';
import {VideoRoom} from '@/components/video/video-room';
import {UrgentHelpDialog} from '@/components/layout/urgent-help-dialog';
export default async function Session({params}:{params:Promise<{id:string}>}){const actor=await requireUser();const {id}=await params;if(!z.uuid().safeParse(id).success)notFound();const [a]=await db().select({id:appointments.id,employeeId:appointments.employeeId,psychologistId:appointments.psychologistId,organizationId:appointments.organizationId,startsAt:appointments.startsAt,endsAt:appointments.endsAt,status:appointments.status,outcome:appointments.outcome}).from(appointments).where(eq(appointments.id,id));if(!a||!(actor.role==='employee'&&actor.id===a.employeeId&&actor.organizationId===a.organizationId||actor.role==='psychologist'&&actor.id===a.psychologistId))notFound();const t=await getTranslations();const window=joinWindow(a.startsAt,a.endsAt,new Date());const ended=!['confirmed','no_show'].includes(a.status)||a.status==='no_show'&&a.outcome!=='pending'||window==='ended';if(ended||window==='early')return <main className="container narrow stack"><Logo/><h1>{t(ended?'video.ended':'video.notYet')}</h1><p className="muted">{ended?t('video.endedDescription'):t('video.notYetDescription',{time:displayTime(new Date(+a.startsAt-10*60000))})}</p><Link href={actor.role==='psychologist'?'/psychologist':'/'} className="btn btn-primary">{t('common.goHome')}</Link></main>;let room:string|null=null;let failed=false;try{room=await ensureVideoRoom(id,actor);}catch{failed=true;}const [employee]=actor.role==='psychologist'?await db().select({fullName:users.fullName}).from(users).where(eq(users.id,a.employeeId)):[];return <main className="video-page"><header className="row wrap"><Logo/><div className="row video-heading"><LockKeyhole/>{t('video.title',{name:actor.role==='employee'?t('profile.name'):employee.fullName,time:`${displayTime(a.startsAt)}–${displayTime(a.endsAt)}`})}</div>{actor.role==='employee'&&<UrgentHelpDialog/>}</header><VideoRoom room={room} endsAt={a.endsAt.toISOString()} failed={failed} home={actor.role==='psychologist'?'/psychologist':'/'}/></main>;}
