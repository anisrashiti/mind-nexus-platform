import {z} from 'zod';
const clock=z.string().regex(/^(?:[01]\d|2[0-3]):(?:00|30)$/);
export const ruleSchema=z.object({weekday:z.number().int().min(1).max(7),startTime:clock,endTime:clock}).refine(r=>r.endTime>r.startTime);
export const availabilitySchema=z.object({rules:z.array(ruleSchema).max(42),timeOff:z.array(z.object({startsAt:z.iso.datetime(),endsAt:z.iso.datetime(),label:z.string().trim().min(1).max(120)}).refine(r=>r.endsAt>r.startsAt)).max(100)}).refine(({rules})=>{
  for(let day=1;day<=7;day++){const ranges=rules.filter(r=>r.weekday===day).sort((a,b)=>a.startTime.localeCompare(b.startTime));if(ranges.some((r,i)=>i>0&&r.startTime<ranges[i-1].endTime))return false;}return true;
});
