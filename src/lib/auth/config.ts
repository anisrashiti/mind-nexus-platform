import 'server-only';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import {verify} from 'argon2';
import {and,eq,gt} from 'drizzle-orm';
import {z} from 'zod';
import {db} from '@/lib/db/client';
import {users,organizations,sessions} from '@/lib/db/schema';
import {hashToken,newToken} from '@/lib/crypto';
import {takeRateLimit} from './rate-limit';
const secure=process.env.APP_URL?.startsWith('https://')??process.env.NODE_ENV==='production';
const maxAge=7*24*60*60;
/** TODO(question): Auth.js rejects Credentials + database strategy. Its JWT codec is replaced with opaque Postgres sessions, not self-contained JWTs. See docs/AUTH.md. */
export const {handlers,auth,signIn,signOut}=NextAuth({
  secret:process.env.AUTH_SECRET,
  pages:{signIn:'/login',error:'/login'},
  trustHost:!!process.env.VERCEL||process.env.NODE_ENV==='development',
  session:{strategy:'jwt',maxAge},
  cookies:{sessionToken:{name:secure?'__Secure-authjs.session-token':'authjs.session-token',options:{httpOnly:true,secure,sameSite:'lax',path:'/'}}},
  providers:[Credentials({credentials:{email:{},password:{}},async authorize(credentials,request){
    if(!process.env.DATABASE_URL||!process.env.AUTH_SECRET)return null;
    const result=z.object({email:z.email().max(254),password:z.string().min(1).max(128)}).safeParse(credentials);if(!result.success)return null;
    const email=result.data.email.toLowerCase();const ip=(request.headers.get('x-vercel-forwarded-for')??request.headers.get('x-forwarded-for')??'unknown').split(',')[0].trim();
    const perPair=await takeRateLimit('login',`${ip}:${email}`,10,15*60000);const perIp=await takeRateLimit('login-ip',ip,10,15*60000);if(!perPair||!perIp)return null;
    const user=(await db().select().from(users).where(eq(users.email,email)).limit(1))[0];
    // A valid dummy argon2 hash equalizes verification work for unknown/invited accounts.
    const fallback='$argon2id$v=19$m=65536,t=3,p=4$MDEyMzQ1Njc4OWFiY2RlZg$S8kcW9K9rnF5kJ3dHBlcJhB3OLmLsGdZ4zA65dlvggU';
    const matches=await verify(user?.passwordHash??fallback,result.data.password).catch(()=>false);
    if(!matches||!user||user.status!=='active')return null;
    if(user.role!=='psychologist'){
      if(!user.organizationId)return null;
      const org=(await db().select({status:organizations.status}).from(organizations).where(eq(organizations.id,user.organizationId)).limit(1))[0];if(org?.status!=='active')return null;
    }
    return {id:user.id};
  }})],
  jwt:{maxAge,async encode({token}){
    if(!token?.sub)return '';
    if(typeof token.jti==='string')return token.jti;
    const raw=newToken();await db().insert(sessions).values({sessionToken:hashToken(raw),userId:token.sub,expires:new Date(Date.now()+maxAge*1000)});return raw;
  },async decode({token}){
    if(!token||!process.env.DATABASE_URL||!/^[a-f0-9]{64}$/.test(token))return null;
    const row=(await db().select({id:users.id,status:users.status}).from(sessions).innerJoin(users,eq(users.id,sessions.userId)).where(and(eq(sessions.sessionToken,hashToken(token)),gt(sessions.expires,new Date()))).limit(1))[0];
    return row?.status==='active'?{sub:row.id,jti:token}:null;
  }},
  callbacks:{async jwt({token,user}){if(user?.id){token.sub=user.id;delete token.jti;}return token;},async session({session,token}){if(session.user)session.user.id=token.sub!;return session;}},
  events:{async signOut(message){if('token' in message&&message.token?.jti)await db().delete(sessions).where(eq(sessions.sessionToken,hashToken(message.token.jti)));}},
  logger:{error(){console.error('auth failure');},warn(code){console.warn('auth:',code);},debug(){}},
});
