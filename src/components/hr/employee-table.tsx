'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Search, Plus, MoreHorizontal, X, Mail } from 'lucide-react';
import { Button, Avatar, Badge, Note } from '@/components/ui/primitives';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';
import { Toast } from '@/components/ui/toast';
import { inviteEmployees, resendInvite, deactivateEmployee } from '@/lib/hr/actions';
import { parseInviteEmails } from '@/lib/hr/invites';
import { displayDate } from '@/lib/dates';
type Employee = {
  id: string;
  fullName: string;
  email: string;
  status: string;
  invitedAt: string | null;
};
function EmployeeMenu({
  employee,
  onMessage,
}: {
  employee: Employee;
  onMessage: (key: string, values?: { count: number }) => void;
}) {
  const t = useTranslations();
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <>
      <Dropdown.Root>
        <Dropdown.Trigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${t('common.actions')} · ${employee.fullName || employee.email}`}
          >
            <MoreHorizontal />
          </Button>
        </Dropdown.Trigger>
        <Dropdown.Portal>
          <Dropdown.Content className="dropdown" align="end">
            {employee.status === 'invited' && (
              <Dropdown.Item
                className="dropdown-item"
                disabled={pending}
                onSelect={() =>
                  start(async () => {
                    try {
                      const result = await resendInvite({ employeeId: employee.id });
                      if (result.failed) onMessage('inviteFailed', { count: result.failed });
                      else onMessage('resendSent');
                    } catch {
                      onMessage('error');
                    }
                  })
                }
              >
                {t('hr.resend')}
              </Dropdown.Item>
            )}
            {employee.status !== 'deactivated' && (
              <Dropdown.Item
                className="dropdown-item"
                style={{ color: 'var(--color-text-danger)' }}
                onSelect={() => setConfirm(true)}
              >
                {t('hr.deactivate')}
              </Dropdown.Item>
            )}
          </Dropdown.Content>
        </Dropdown.Portal>
      </Dropdown.Root>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent title={t('hr.deactivateTitle')} description={t('hr.deactivateDescription')}>
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
              variant="danger"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  try {
                    await deactivateEmployee({ employeeId: employee.id });
                    setConfirm(false);
                    onMessage('deactivated');
                  } catch {
                    setError(true);
                  }
                })
              }
            >
              {t('hr.deactivate')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function EmployeeTable({ employees }: { employees: Employee[] }) {
  const t = useTranslations();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [chips, setChips] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [pending, start] = useTransition();
  const parsed = parseInviteEmails([...chips, draft].join(' '));
  const filtered = employees.filter(
    (e) =>
      (e.fullName + ' ' + e.email).toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || e.status === filter),
  );
  const showMessage = (key: string, values?: { count: number }) =>
    setToast(key === 'error' ? t('common.error') : t(`hr.${key}`, values));
  return (
    <>
      <div className="toolbar">
        <div className="field search">
          <label className="sr-only" htmlFor="hr-search">
            {t('common.search')}
          </label>
          <div className="input-icon">
            <Search />
            <input
              id="hr-search"
              className="input"
              placeholder={t('common.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <label className="sr-only" htmlFor="access-filter">
          {t('hr.access')}
        </label>
        <select
          id="access-filter"
          className="input"
          style={{ width: 'auto' }}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">{t('common.allStatuses')}</option>
          {['active', 'invited', 'deactivated'].map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              {t('hr.invite')}
            </Button>
          </DialogTrigger>
          <DialogContent title={t('hr.invite')} description={t('hr.inviteDescription')}>
            <form
              className="stack"
              onSubmit={(e) => {
                e.preventDefault();
                setError('');
                start(async () => {
                  try {
                    const result = await inviteEmployees({ emails: [...chips, draft].join(' ') });
                    if (result.error) setError(t(`hr.${result.error}`));
                    else {
                      setInviteOpen(false);
                      setDraft('');
                      setChips([]);
                      if (result.failed) showMessage('inviteFailed', { count: result.failed });
                      else showMessage('inviteSent');
                    }
                  } catch {
                    setError(t('common.error'));
                  }
                });
              }}
            >
              <div className="field">
                <label htmlFor="invite-emails">{t('hr.emails')}</label>
                <div className="email-chips">
                  {chips.map((email) => (
                    <span className="email-chip" key={email}>
                      {email}
                      <button
                        type="button"
                        className="chip-remove"
                        aria-label={t('hr.removeEmail', { email })}
                        onClick={() => setChips((prev) => prev.filter((c) => c !== email))}
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  <textarea
                    id="invite-emails"
                    value={draft}
                    maxLength={26000}
                    aria-invalid={!!parsed.invalid.length}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                      const current = parseInviteEmails(draft);
                      setChips((prev) => [...new Set([...prev, ...current.emails])]);
                      setDraft(current.invalid.join(' '));
                    }}
                  />
                </div>
              </div>
              {(error || parsed.invalid.length > 0) && (
                <div role="alert">
                  <Note tone="danger">{error || t('hr.invalidEmails')}</Note>
                </div>
              )}
              <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
                <DialogClose asChild>
                  <Button variant="secondary" type="button">
                    {t('common.cancel')}
                  </Button>
                </DialogClose>
                <Button
                  disabled={
                    pending ||
                    !parsed.emails.length ||
                    !!parsed.invalid.length ||
                    parsed.emails.length > 100
                  }
                >
                  <Mail />
                  {pending ? t('common.pending') : t('hr.send', { count: parsed.emails.length })}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <section className="card table-wrap" style={{ padding: 8 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t('common.name')}</th>
              <th>{t('common.email')}</th>
              <th>{t('hr.access')}</th>
              <th>{t('hr.invitedDate')}</th>
              <th>
                <span className="sr-only">{t('common.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((employee) => (
              <tr key={employee.id}>
                <td>
                  <div className="row">
                    <Avatar name={employee.fullName || employee.email} size="sm" />
                    {employee.fullName || '—'}
                  </div>
                </td>
                <td className="muted">{employee.email}</td>
                <td>
                  <Badge
                    tone={
                      employee.status === 'active'
                        ? 'success'
                        : employee.status === 'invited'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {t(`status.${employee.status}`)}
                  </Badge>
                </td>
                <td className="muted">
                  {employee.invitedAt
                    ? displayDate(new Date(employee.invitedAt), 'd MMM yyyy')
                    : '—'}
                </td>
                <td>
                  {employee.status !== 'deactivated' && (
                    <EmployeeMenu employee={employee} onMessage={showMessage} />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="empty muted">{t('hr.noEmployees')}</p>}
      </section>
      <Toast
        message={toast}
        open={!!toast}
        onOpenChange={(open) => {
          if (!open) setToast('');
        }}
      />
    </>
  );
}
