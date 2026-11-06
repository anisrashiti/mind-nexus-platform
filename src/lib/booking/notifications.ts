import 'server-only';
import {eq} from 'drizzle-orm';
import {db} from '@/lib/db/client';
import {users,type Appointment} from '@/lib/db/schema';
import {sendEmail} from '@/lib/email/send';
import {displayDate,displayTime} from '@/lib/dates';
import {calendarFile} from './calendar';
import {closeVideoRoom} from '@/lib/video/whereby';
export async function notifyConfirmed(data:{appointment:Appointment;employee:{id:string;email:string};psychologist:{id:string;email:string}}){await Promise.all([data.employee,data.psychologist].map(user=>sendEmail({template:'booking-confirmed',userId:user.id,to:user.email,values:{date:displayDate(data.appointment.startsAt),time:displayTime(data.appointment.startsAt)},attachment:calendarFile(data.appointment),idempotencyKey:`confirmed-${data.appointment.id}-${user.id}`})));}
export async function notifyCancelled(appointment:Appointment,byEmployee:boolean,refund:boolean){await closeVideoRoom(appointment.id).catch(()=>console.error('room cleanup failure:',appointment.id));const userId=byEmployee?appointment.psychologistId:appointment.employeeId;const [user]=await db().select({id:users.id,email:users.email}).from(users).where(eq(users.id,userId));if(user)await sendEmail({template:'cancelled',userId:user.id,to:user.email,values:{date:displayDate(appointment.startsAt),time:displayTime(appointment.startsAt)},returned:byEmployee?undefined:refund,idempotencyKey:`cancelled-${appointment.id}-${user.id}`});}
