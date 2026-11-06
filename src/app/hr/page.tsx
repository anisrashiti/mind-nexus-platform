import { getTranslations } from 'next-intl/server';
import { EyeOff } from 'lucide-react';
import { requireHr } from '@/lib/auth/guards';
import { logoutAction } from '@/lib/auth/actions';
import { hrSnapshot } from '@/lib/hr/queries';
import { TopBar } from '@/components/layout/app-chrome';
import { Footer } from '@/components/layout/footer';
import { StatCard, Note } from '@/components/ui/primitives';
import { EmployeeTable } from '@/components/hr/employee-table';
export default async function Hr() {
  const actor = await requireHr();
  const t = await getTranslations('hr');
  const data = await hrSnapshot(actor.organizationId!);
  return (
    <>
      <TopBar
        user={{ fullName: actor.fullName, role: 'hr' }}
        organization={data.organization}
        onSignOut={logoutAction}
      />
      <main className="container stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <h1>{t('title')}</h1>
          <p className="muted">{t('description')}</p>
        </div>
        <div className="grid-3">
          <StatCard
            label={t('invited')}
            value={data.employees.length}
            caption={t('invitedCaption')}
          />
          <StatCard label={t('accounts')} value={data.accounts} caption={t('accountsCaption')} />
          <StatCard
            label={t('used')}
            value={
              data.used === null ? (
                <span
                  style={{ fontFamily: 'var(--font-instrument)', fontSize: 15, lineHeight: '24px' }}
                >
                  {t('hidden')}
                </span>
              ) : (
                data.used
              )
            }
            caption={data.used === null ? undefined : t('usedCaption')}
          />
        </div>
        <Note icon={<EyeOff />}>{t('privacy')}</Note>
        <EmployeeTable
          employees={data.employees.map((e) => ({
            ...e,
            invitedAt: e.invitedAt?.toISOString() ?? null,
          }))}
        />
      </main>
      <Footer />
    </>
  );
}
