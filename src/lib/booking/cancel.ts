import 'server-only';
import {and,eq} from 'drizzle-orm';
import {db} from '@/lib/db/client';
import {users,appointments,auditLog,type User} from '@/lib/db/schema';
import {BookingError} from './service';
import {cancellationOutcome} from './rules';
import {refundOnce} from './settle';
export async function cancelEmployeeBooking(employee:Pick<User,'id'|'organizationId'>,appointmentId:string,now=new Date()){
  return db().transaction(async tx=>{
    const [locked]=await tx.select().from(users).where(eq(users.id,employee.id)).for('update');if(!locked||locked.role!=='employee'||locked.status!=='active'||locked.organizationId!==employee.organizationId)throw new BookingError('unavailable');
    const [appointment]=await tx.select().from(appointments).where(and(eq(appointments.id,appointmentId),eq(appointments.employeeId,employee.id),eq(appointments.organizationId,employee.organizationId!))).for('update');
    if(!appointment||appointment.status!=='confirmed'||appointment.endsAt<=now)throw new BookingError('unavailable');
    const result=cancellationOutcome(appointment.startsAt,now);await tx.update(appointments).set({status:result.status,outcome:result.outcome,cancelledAt:now,cancelledBy:employee.id}).where(eq(appointments.id,appointment.id));if(result.refund)await refundOnce(tx,appointment,employee.id);await tx.insert(auditLog).values({actorId:employee.id,action:`appointment.${result.status}`,entity:'appointments',entityId:appointment.id});return {appointment,refund:result.refund};
  });
}
