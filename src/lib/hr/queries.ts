import 'server-only';
import {and,eq,count,isNotNull} from 'drizzle-orm';
import {db} from '@/lib/db/client';
import {users,appointments,organizations} from '@/lib/db/schema';
import {visibleUsageTotal} from './privacy';
import {usedSessionCondition} from '@/lib/organization/queries';
export async function hrSnapshot(organizationId:string){
  // Deliberately separate from the clinician DTO: no appointments, balances, tokens or messages cross this boundary.
  const [employees,[org],[accounts],[usage]]=await Promise.all([
    db().select({id:users.id,fullName:users.fullName,email:users.email,status:users.status,invitedAt:users.invitedAt}).from(users).where(and(eq(users.organizationId,organizationId),eq(users.role,'employee'))).orderBy(users.fullName),
    db().select({name:organizations.name}).from(organizations).where(eq(organizations.id,organizationId)),
    db().select({count:count()}).from(users).where(and(eq(users.organizationId,organizationId),eq(users.role,'employee'),isNotNull(users.activatedAt))),
    db().select({count:count()}).from(appointments).where(and(eq(appointments.organizationId,organizationId),usedSessionCondition())),
  ]);return {organization:org.name,employees,accounts:accounts.count,used:visibleUsageTotal(usage.count)};
}
