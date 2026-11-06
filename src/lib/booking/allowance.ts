import 'server-only';
import {eq,sql} from 'drizzle-orm';
import {db,type Transaction} from '@/lib/db/client';
import {users,organizations,sessionLedger} from '@/lib/db/schema';
export async function getRemaining(employeeId:string,transaction?:Transaction){const database=transaction??db();const [employee]=await database.select({base:organizations.sessionsPerEmployee}).from(users).innerJoin(organizations,eq(users.organizationId,organizations.id)).where(eq(users.id,employeeId));if(!employee)return 0;const [ledger]=await database.select({amount:sql<number>`coalesce(sum(${sessionLedger.amount}),0)::int`}).from(sessionLedger).where(eq(sessionLedger.employeeId,employeeId));return employee.base+Number(ledger.amount);}
