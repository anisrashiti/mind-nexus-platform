import 'server-only';
import {and,eq,gt} from 'drizzle-orm';
import {db} from '@/lib/db/client';
import {users,organizations,appointments,sessionLedger,consents,auditLog,type User} from '@/lib/db/schema';
import {getRemaining} from './allowance';
import {getAvailableSlots} from './slots';
import {localDate} from '@/lib/dates';
import {placeholders} from '@/content/placeholders';
import {settleExpired} from './settle';
export class BookingError extends Error{constructor(public code:string){super(code);}}
export async function createBooking(employee:Pick<User,'id'|'organizationId'>,start:Date,accepted:boolean,now=new Date()){
  if(!accepted)throw new BookingError('consentRequired');
  if(process.env.NODE_ENV==='production'&&!placeholders.consentApproved)throw new BookingError('consentPending');
  try{return await db().transaction(async tx=>{
    const [locked]=await tx.select().from(users).where(eq(users.id,employee.id)).for('update');
    if(!locked||locked.role!=='employee'||locked.status!=='active'||!locked.organizationId||locked.organizationId!==employee.organizationId)throw new BookingError('unavailable');
    const [org]=await tx.select().from(organizations).where(eq(organizations.id,locked.organizationId)).for('share');if(org?.status!=='active')throw new BookingError('unavailable');
    const [psychologist]=await tx.select().from(users).where(and(eq(users.role,'psychologist'),eq(users.status,'active'),eq(users.isAdmin,true))).for('update').limit(1);if(!psychologist)throw new BookingError('unavailable');
    await settleExpired(tx,locked.id,now);
    if(await getRemaining(locked.id,tx)<1)throw new BookingError('noAllowance');
    if((await tx.select({id:appointments.id}).from(appointments).where(and(eq(appointments.employeeId,locked.id),eq(appointments.status,'confirmed'),gt(appointments.endsAt,now))).limit(1)).length)throw new BookingError('alreadyBooked');
    const slots=await getAvailableSlots(psychologist.id,localDate(start),localDate(start),now,tx);if(!slots.some(s=>+s===+start))throw new BookingError('taken');
    const [appointment]=await tx.insert(appointments).values({employeeId:locked.id,psychologistId:psychologist.id,organizationId:locked.organizationId,startsAt:start,endsAt:new Date(+start+50*60000)}).returning();
    await tx.insert(sessionLedger).values({employeeId:locked.id,amount:-1,reason:'booking',appointmentId:appointment.id,createdBy:locked.id});
    await tx.insert(consents).values({userId:locked.id,version:placeholders.consentVersion}).onConflictDoNothing();
    await tx.insert(auditLog).values({actorId:locked.id,action:'appointment.confirmed',entity:'appointments',entityId:appointment.id});return {appointment,employee:locked,psychologist};
  });}catch(error){if(error instanceof BookingError)throw error;const code=(error as {cause?:{code?:string};code?:string}).cause?.code??(error as {code?:string}).code;if(code==='23P01'||code==='23505')throw new BookingError('taken');throw error;}
}
