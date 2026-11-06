import {AuthShell} from '@/components/auth/auth-shell';
import {redirectAuthenticated} from '@/lib/auth/guards';
export default async function Layout({children}:{children:React.ReactNode}){await redirectAuthenticated();return <AuthShell>{children}</AuthShell>;}
