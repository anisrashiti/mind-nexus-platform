import 'server-only';
import {and,eq} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '@/lib/db/client';
import {appointments,type User} from '@/lib/db/schema';
import {encrypt,decrypt} from '@/lib/crypto';
import {joinWindow} from '@/lib/booking/rules';
import {participantExternalId,participantMetadata} from './signature';
const roomUrl=z.url().refine(value=>{const u=new URL(value);return u.protocol==='https:'&&(u.hostname==='whereby.com'||u.hostname.endsWith('.whereby.com'));});
export async function ensureVideoRoom(appointmentId:string,actor:User){
  return db().transaction(async tx=>{
    const [a]=await tx.select().from(appointments).where(eq(appointments.id,appointmentId)).for('update');
    if(!a||!(actor.id===a.employeeId&&actor.role==='employee'&&actor.organizationId===a.organizationId||actor.id===a.psychologistId&&actor.role==='psychologist')||!['confirmed','no_show'].includes(a.status)||a.status==='no_show'&&a.outcome!=='pending'||joinWindow(a.startsAt,a.endsAt,new Date())!=='open')throw new Error('Session unavailable');
    const role=actor.id===a.employeeId?'employee':'psychologist';
    if(!process.env.WHEREBY_API_KEY){if(process.env.NODE_ENV==='production')throw new Error('Video service is not configured');return null;}
    let participant=a.wherebyRoomUrlEnc,host=a.wherebyHostUrlEnc;
    if(!participant||!host){
      const response=await fetch('https://api.whereby.dev/v1/meetings',{method:'POST',headers:{Authorization:`Bearer ${process.env.WHEREBY_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({endDate:a.endsAt.toISOString(),roomMode:'normal',roomNamePrefix:'mn-',roomNamePattern:'uuid',isLocked:true,fields:['hostRoomUrl'],recording:{type:'none',destination:null,startTrigger:'none'},liveTranscription:{destination:null,startTrigger:'none',liveCaptions:false}}),signal:AbortSignal.timeout(10000),cache:'no-store'});
      if(!response.ok)throw new Error('Video room creation failed');const result=z.object({meetingId:z.union([z.string(),z.number()]),roomUrl,hostRoomUrl:roomUrl}).parse(await response.json());
      participant=encrypt(result.roomUrl);host=encrypt(result.hostRoomUrl);await tx.update(appointments).set({wherebyMeetingId:String(result.meetingId),wherebyRoomUrlEnc:participant,wherebyHostUrlEnc:host}).where(eq(appointments.id,a.id));
    }
    const url=new URL(decrypt(role==='employee'?participant:host));
    url.searchParams.set('displayName',(role==='employee'?actor.fullName.split(' ')[0]:'Luljeta').replace(/[$!<>:;]/g,'').slice(0,100));
    url.searchParams.set('externalId',participantExternalId(a.id,role));url.searchParams.set('metadata',participantMetadata(a.id,role));
    for(const [key,value] of Object.entries({lang:'en',chat:'off',chatDownload:'off',recording:'off',screenshare:'off',people:'off',participantCount:'off',moreButton:'off',roomIntegrations:'off',transcription:'off',leaveButton:'on'}))url.searchParams.set(key,value);
    return url.toString();
  });
}
export async function closeVideoRoom(appointmentId:string){const [a]=await db().select({meetingId:appointments.wherebyMeetingId}).from(appointments).where(eq(appointments.id,appointmentId));if(!a?.meetingId||!process.env.WHEREBY_API_KEY)return;const response=await fetch(`https://api.whereby.dev/v1/meetings/${encodeURIComponent(a.meetingId)}`,{method:'DELETE',headers:{Authorization:`Bearer ${process.env.WHEREBY_API_KEY}`},signal:AbortSignal.timeout(8000),cache:'no-store'});if(!response.ok&&response.status!==404)throw new Error('Room deletion failed');await db().update(appointments).set({wherebyRoomUrlEnc:null,wherebyHostUrlEnc:null}).where(and(eq(appointments.id,appointmentId),eq(appointments.wherebyMeetingId,a.meetingId)));}
