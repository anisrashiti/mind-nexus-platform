'use server';
import {eq} from 'drizzle-orm';
import {revalidatePath} from 'next/cache';
import {requirePsychologist} from '@/lib/auth/guards';
import {db} from '@/lib/db/client';
import {users,availabilityRules,timeOff,auditLog} from '@/lib/db/schema';
import {availabilitySchema} from './validation';
export async function saveAvailability(input:unknown){const user=await requirePsychologist();const result=availabilitySchema.safeParse(input);if(!result.success)return {error:'invalidRange'};await db().transaction(async tx=>{
  await tx.select({id:users.id}).from(users).where(eq(users.id,user.id)).for('update');
  await tx.delete(availabilityRules).where(eq(availabilityRules.psychologistId,user.id));if(result.data.rules.length)await tx.insert(availabilityRules).values(result.data.rules.map(rule=>({...rule,psychologistId:user.id})));
  await tx.delete(timeOff).where(eq(timeOff.psychologistId,user.id));if(result.data.timeOff.length)await tx.insert(timeOff).values(result.data.timeOff.map(range=>({...range,psychologistId:user.id,startsAt:new Date(range.startsAt),endsAt:new Date(range.endsAt)})));
  await tx.insert(auditLog).values({actorId:user.id,action:'availability.updated',entity:'users',entityId:user.id});
});revalidatePath('/psychologist/availability');revalidatePath('/book');return {success:true};}
