import 'server-only';
import {sql} from 'drizzle-orm';
import {db} from '@/lib/db/client';
import {rateLimits} from '@/lib/db/schema';
import {privateKey} from '@/lib/crypto';
export async function takeRateLimit(scope:string,identity:string,limit:number,windowMs:number){
  const now=new Date();const reset=new Date(+now+windowMs);const key=privateKey(`${scope}:${identity}`);
  const [result]=await db().insert(rateLimits).values({key,count:1,resetsAt:reset}).onConflictDoUpdate({target:rateLimits.key,set:{count:sql`case when ${rateLimits.resetsAt} <= ${now.toISOString()} then 1 else ${rateLimits.count} + 1 end`,resetsAt:sql`case when ${rateLimits.resetsAt} <= ${now.toISOString()} then ${reset.toISOString()} else ${rateLimits.resetsAt} end`}}).returning({count:rateLimits.count});
  return result.count<=limit;
}
