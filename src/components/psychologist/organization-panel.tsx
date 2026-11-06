'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Plus, Minus, Pencil } from 'lucide-react';
import { Button, Badge, Avatar, Input, Select, StatCard, Note } from '@/components/ui/primitives';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Toast } from '@/components/ui/toast';
import { updateOrganization, grantExtraSession } from '@/lib/psychologist/actions';
type Org = {
  name: string;
  hrContactName: string;
  hrContactEmail: string;
  sessionsPerEmployee: number;
  status: 'active' | 'inactive';
};
type Employee = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  activated: boolean;
  remaining: number;
  session: string;
};
function ExtraSession({ employee }: { employee: Employee }) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost">
          <Plus />
          {t('organization.extra')}
        </Button>
      </DialogTrigger>
      <DialogContent
        title={t('organization.extraTitle')}
        description={t('organization.extraDescription', { name: employee.fullName })}
      >
        {error && (
          <p role="alert" className="field-error">
            {t('common.error')}
          </p>
        )}
        <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
          <DialogClose asChild>
            <Button variant="secondary">{t('common.cancel')}</Button>
          </DialogClose>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  const result = await grantExtraSession({ employeeId: employee.id });
                  if (result.error) setError(true);
                  else setOpen(false);
                } catch {
                  setError(true);
                }
              })
            }
          >
            {t('organization.extra')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
export function OrganizationPanel({
  org,
  employees,
  booked,
  used,
}: {
  org: Org;
  employees: Employee[];
  booked: number;
  used: number;
}) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState('');
  const [toast, setToast] = useState(false);
  const filtered = employees.filter(
    (e) =>
      (e.fullName + ' ' + e.email).toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || e.session === filter),
  );
  const update = (values: Org) => {
    setError('');
    start(async () => {
      try {
        const result = await updateOrganization(values);
        if (result.error) setError(t('common.invalid'));
        else {
          setOpen(false);
          setToast(true);
        }
      } catch {
        setError(t('common.error'));
      }
    });
  };
  return (
    <>
      <div className="org-overview">
        <section className="card stack">
          <h2>{t('psychologist.organization')}</h2>
          <dl className="detail-list">
            <dt>{t('organization.hrName')}</dt>
            <dd>{org.hrContactName}</dd>
            <dt>{t('organization.hrEmail')}</dt>
            <dd style={{ overflowWrap: 'anywhere' }}>{org.hrContactEmail}</dd>
            <dt>{t('common.status')}</dt>
            <dd>
              <Badge tone={org.status === 'active' ? 'success' : 'neutral'}>
                {org.status === 'active' ? t('status.active') : t('status.deactivated')}
              </Badge>
            </dd>
          </dl>
          <hr className="divider" />
          <div className="row between wrap">
            <span>{t('organization.sessionsPerEmployee')}</span>
            <div className="row" style={{ gap: 0 }}>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t('organization.decrease')}
                disabled={pending || org.sessionsPerEmployee <= 1}
                onClick={() => update({ ...org, sessionsPerEmployee: org.sessionsPerEmployee - 1 })}
              >
                <Minus />
              </Button>
              <strong style={{ minWidth: 44, textAlign: 'center' }}>
                {org.sessionsPerEmployee}
              </strong>
              <Button
                variant="secondary"
                size="icon"
                aria-label={t('organization.increase')}
                disabled={pending || org.sessionsPerEmployee >= 10}
                onClick={() => update({ ...org, sessionsPerEmployee: org.sessionsPerEmployee + 1 })}
              >
                <Plus />
              </Button>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" style={{ alignSelf: 'flex-start' }}>
                <Pencil />
                {t('organization.edit')}
              </Button>
            </DialogTrigger>
            <DialogContent title={t('organization.edit')}>
              <form
                className="stack"
                onSubmit={(event) => {
                  event.preventDefault();
                  const f = new FormData(event.currentTarget);
                  update({
                    ...org,
                    name: String(f.get('name')),
                    hrContactName: String(f.get('hrContactName')),
                    hrContactEmail: String(f.get('hrContactEmail')),
                    status: f.get('status') as Org['status'],
                  });
                }}
              >
                <Input
                  name="name"
                  label={t('organization.name')}
                  defaultValue={org.name}
                  required
                  maxLength={120}
                />
                <Input
                  name="hrContactName"
                  label={t('organization.hrName')}
                  defaultValue={org.hrContactName}
                  required
                  maxLength={120}
                />
                <Input
                  name="hrContactEmail"
                  label={t('organization.hrEmail')}
                  defaultValue={org.hrContactEmail}
                  required
                  type="email"
                  maxLength={254}
                />
                <Select name="status" label={t('common.status')} defaultValue={org.status}>
                  <option value="active">{t('status.active')}</option>
                  <option value="inactive">{t('status.deactivated')}</option>
                </Select>
                {error && (
                  <p className="field-error" role="alert">
                    {error}
                  </p>
                )}
                <div className="row" style={{ justifyContent: 'flex-end' }}>
                  <DialogClose asChild>
                    <Button type="button" variant="secondary">
                      {t('common.cancel')}
                    </Button>
                  </DialogClose>
                  <Button disabled={pending}>{t('common.save')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </section>
        <div className="grid-3">
          <StatCard label={t('organization.employees')} value={employees.length} />
          <StatCard label={t('organization.booked')} value={booked} />
          <StatCard label={t('organization.used')} value={used} />
        </div>
      </div>
      {error && !open && (
        <div role="alert">
          <Note tone="danger">{error}</Note>
        </div>
      )}
      <div className="toolbar">
        <div className="field search">
          <label className="sr-only" htmlFor="employee-search">
            {t('common.search')}
          </label>
          <div className="input-icon">
            <Search />
            <input
              className="input"
              id="employee-search"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <label className="sr-only" htmlFor="session-filter">
          {t('common.status')}
        </label>
        <select
          className="input"
          id="session-filter"
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t('common.allStatuses')}</option>
          {['none', 'confirmed', 'completed', 'no_show', 'late_cancelled', 'cancelled'].map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </div>
      <section className="card table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.email')}</th>
              <th>{t('common.status')}</th>
              <th>{t('organization.remaining')}</th>
              <th>
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id}>
                <td>
                  <div className="row">
                    <Avatar name={e.fullName} size="sm" />
                    {e.fullName}
                  </div>
                </td>
                <td className="muted">{e.email}</td>
                <td>
                  <Badge
                    tone={
                      e.session === 'confirmed' || e.session === 'completed'
                        ? 'success'
                        : e.session === 'no_show' || e.session === 'late_cancelled'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {t(`status.${e.session}`)}
                  </Badge>
                </td>
                <td>{e.remaining}</td>
                <td>{e.status === 'active' && <ExtraSession employee={e} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="empty muted">{t('hr.noEmployees')}</p>}
      </section>
      <Toast message={t('organization.saved')} open={toast} onOpenChange={setToast} />
    </>
  );
}
