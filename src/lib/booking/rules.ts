import {JOIN_GRACE_AFTER_END_MIN} from '@/lib/constants';
export const remainingAllowance=(base:number,ledger:number[])=>base+ledger.reduce((total,amount)=>total+amount,0);
export function cancellationOutcome(startsAt:Date,now:Date){return +startsAt-+now>=24*3600000?{status:'cancelled' as const,outcome:'none' as const,refund:true}:{status:'late_cancelled' as const,outcome:'pending' as const,refund:false};}
export const joinWindow=(startsAt:Date,endsAt:Date,now:Date)=>+now<+startsAt-10*60000?'early':+now>=+endsAt+JOIN_GRACE_AFTER_END_MIN*60000?'ended':'open';
