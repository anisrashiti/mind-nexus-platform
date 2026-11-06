import {and,eq,gt,isNull} from 'drizzle-orm';
import {AuthForm} from '@/components/auth/auth-form';
import {db} from '@/lib/db/client';
import {invites,organizations} from '@/lib/db/schema';
import {hashToken} from '@/lib/crypto';
import {tokenSchema} from '@/lib/auth/password';
import {redirectAuthenticated} from '@/lib/auth/guards';
export default async function Invite({params}:{params:Promise<{token:string}>}){await redirectAuthenticated();const {token}=await params;if(!process.env.DATABASE_URL||!tokenSchema.safeParse(token).success)return <AuthForm mode="invite" invalid/>;const row=(await db().select({email:invites.email,organization:organizations.name}).from(invites).innerJoin(organizations,eq(organizations.id,invites.organizationId)).where(and(eq(invites.tokenHash,hashToken(token)),gt(invites.expiresAt,new Date()),isNull(invites.acceptedAt),eq(organizations.status,'active'))).limit(1))[0];return <AuthForm mode="invite" token={token} email={row?.email} organization={row?.organization} invalid={!row}/>;}
