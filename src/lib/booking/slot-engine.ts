import {formatInTimeZone,fromZonedTime} from 'date-fns-tz';
import {TIME_ZONE,SESSION_MINUTES,BLOCKING_STATUSES} from '@/lib/constants';
import {nextDate} from '@/lib/dates';
export type AvailabilityRule={weekday:number;startTime:string;endTime:string};
export type Interval={startsAt:Date;endsAt:Date};
export type BusyAppointment=Interval&{status:string};
export type SlotInput={rules:AvailabilityRule[];timeOff:Interval[];appointments:BusyAppointment[];fromDate:string;toDate:string;now:Date};
export const overlaps=(a:Interval,b:Interval)=>a.startsAt<b.endsAt&&a.endsAt>b.startsAt;
const minutes=(value:string)=>Number(value.slice(0,2))*60+Number(value.slice(3,5));
export function generateSlots({rules,timeOff,appointments,fromDate,toDate,now}:SlotInput):Date[]{
  if(!Number.isFinite(+now)||fromDate>toDate)return [];
  const minimum=+now+12*3600000,maximum=+now+28*86400000;
  const busy=[...timeOff,...appointments.filter(a=>BLOCKING_STATUSES.includes(a.status as typeof BLOCKING_STATUSES[number]))];
  const starts=new Set<number>();let count=0;
  for(let day=fromDate;day<=toDate&&count<366;day=nextDate(day),count++){
    const weekday=new Date(`${day}T12:00:00Z`).getUTCDay()||7;
    for(const rule of rules.filter(r=>r.weekday===weekday)){
      const end=fromZonedTime(`${day}T${rule.endTime.slice(0,5)}:00`,TIME_ZONE);
      for(let minute=Math.ceil(minutes(rule.startTime)/30)*30;minute<minutes(rule.endTime);minute+=30){
        const clock=`${String(Math.floor(minute/60)).padStart(2,'0')}:${String(minute%60).padStart(2,'0')}`;
        const local=`${day}T${clock}:00`;const start=fromZonedTime(local,TIME_ZONE);
        // Nonexistent spring times are skipped; fall-back uses date-fns-tz's canonical occurrence.
        if(formatInTimeZone(start,TIME_ZONE,"yyyy-MM-dd'T'HH:mm:ss")!==local)continue;
        const candidate={startsAt:start,endsAt:new Date(+start+SESSION_MINUTES*60000)};
        if(+start<minimum||+start>maximum||candidate.endsAt>end||busy.some(interval=>overlaps(candidate,interval)))continue;
        starts.add(+start);
      }
    }
  }
  return [...starts].sort((a,b)=>a-b).map(value=>new Date(value));
}
