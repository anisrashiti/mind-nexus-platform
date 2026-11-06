import {isNull,count} from 'drizzle-orm';
import {requirePsychologist} from '@/lib/auth/guards';
import {logoutAction} from '@/lib/auth/actions';
import {PsychologistSidebar} from '@/components/layout/app-chrome';
import {db} from '@/lib/db/client';
import {urgentMessages} from '@/lib/db/schema';
export default async function Layout({children}:{children:React.ReactNode}){const user=await requirePsychologist();const [result]=await db().select({count:count()}).from(urgentMessages).where(isNull(urgentMessages.readAt));return <><PsychologistSidebar user={{fullName:user.fullName,role:user.role}} unread={result.count} onSignOut={logoutAction}/><main className="psychologist-main">{children}</main></>;}
