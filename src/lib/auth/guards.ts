import 'server-only';
import {cache} from 'react';
import {redirect,notFound} from 'next/navigation';
import {eq} from 'drizzle-orm';
import {auth} from './config';
import {db} from '@/lib/db/client';
import {users,organizations,type User} from '@/lib/db/schema';
export const currentUser=cache(async()=>{
  if(!process.env.DATABASE_URL||!process.env.AUTH_SECRET)return null;
  const session=await auth();if(!session?.user?.id)return null;
  const user=(await db().select().from(users).where(eq(users.id,session.user.id)).limit(1))[0];if(!user||user.status!=='active')return null;
  if(user.role!=='psychologist'){
    if(!user.organizationId)return null;const org=(await db().select({status:organizations.status}).from(organizations).where(eq(organizations.id,user.organizationId)).limit(1))[0];if(org?.status!=='active')return null;
  }return user;
});
export const roleHome=(role:User['role'])=>role==='psychologist'?'/psychologist':role==='hr'?'/hr':'/';
export async function requireUser(){const user=await currentUser();if(!user)redirect('/login');return user;}
async function requireRole(role:User['role'],organizationId?:string){const user=await requireUser();if(user.role!==role)redirect(roleHome(user.role));if(role!=='psychologist'&&(!user.organizationId||(organizationId&&organizationId!==user.organizationId)))notFound();if(role==='psychologist'&&!user.isAdmin)notFound();return user;}
export const requireEmployee=(organizationId?:string)=>requireRole('employee',organizationId);
export const requireHr=(organizationId?:string)=>requireRole('hr',organizationId);
export const requirePsychologist=()=>requireRole('psychologist');
export async function redirectAuthenticated(){const user=await currentUser();if(user)redirect(roleHome(user.role));}
