import { requireEmployee } from '@/lib/auth/guards';
import { logoutAction } from '@/lib/auth/actions';
import { TopBar } from '@/components/layout/app-chrome';
import { Footer } from '@/components/layout/footer';
import { UrgentHelpDialog } from '@/components/layout/urgent-help-dialog';
export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireEmployee();
  return (
    <>
      <TopBar
        user={{ fullName: user.fullName, role: 'employee' }}
        urgent={<UrgentHelpDialog />}
        onSignOut={logoutAction}
      />
      {children}
      <Footer />
    </>
  );
}
