'use client';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Mail, LockKeyhole, UserRound, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button, Input, Badge, Note } from '@/components/ui/primitives';
import { Checkbox } from '@/components/ui/controls';
import {
  loginAction,
  forgotAction,
  acceptInviteAction,
  resetPasswordAction,
} from '@/lib/auth/actions';
import { passwordRules } from '@/lib/auth/password';
type Mode = 'login' | 'forgot' | 'invite' | 'reset';
export function AuthForm({
  mode,
  token,
  email,
  organization,
  invalid = false,
}: {
  mode: Mode;
  token?: string;
  email?: string;
  organization?: string;
  invalid?: boolean;
}) {
  const t = useTranslations('auth');
  const c = useTranslations('common');
  const action = {
    login: loginAction,
    forgot: forgotAction,
    invite: acceptInviteAction,
    reset: resetPasswordAction,
  }[mode];
  const [state, formAction, pending] = useActionState(action, {});
  const [password, setPassword] = useState('');
  const [terms, setTerms] = useState(false);
  const rules = passwordRules(password);
  const title = {
    login: 'signIn',
    forgot: 'forgotTitle',
    invite: 'inviteTitle',
    reset: 'resetTitle',
  } as const;
  const desc = {
    login: 'description',
    forgot: 'forgotDescription',
    invite: 'inviteDescription',
    reset: 'resetDescription',
  } as const;
  if (invalid)
    return (
      <div className="stack">
        <h1>{t('expired')}</h1>
        <Link href="/login" className="btn btn-primary">
          {t('backSignIn')}
        </Link>
      </div>
    );
  if (state.success)
    return (
      <div className="stack">
        <div className="row" style={{ color: 'var(--color-text-success)' }}>
          <Check size={28} />
        </div>
        <h1>{mode === 'forgot' ? t('checkTitle') : t('resetTitle')}</h1>
        <p className="muted">{mode === 'forgot' ? t('checkDescription') : t('resetSuccess')}</p>
        <Link href="/login" className="row">
          <ArrowLeft />
          {t('backSignIn')}
        </Link>
      </div>
    );
  return (
    <form action={formAction} className="stack">
      {mode !== 'login' && (
        <Link className="row" href="/login">
          <ArrowLeft />
          {t('backSignIn')}
        </Link>
      )}
      {organization && <Badge tone="brand">{t('invitedBy', { organization })}</Badge>}
      <div className="stack" style={{ gap: 8 }}>
        <h1>{t(title[mode])}</h1>
        <p className="muted">{t(desc[mode])}</p>
      </div>
      {state.error && (
        <div role="alert">
          <Note tone="danger">{t.has(state.error) ? t(state.error) : c('invalid')}</Note>
        </div>
      )}
      {token && <input type="hidden" name="token" value={token} />}
      {mode !== 'reset' && (
        <Input
          label={t('email')}
          name="email"
          type="email"
          autoComplete="email"
          required
          readOnly={mode === 'invite'}
          defaultValue={email}
          icon={<Mail />}
          maxLength={254}
        />
      )}
      {mode === 'invite' && (
        <Input
          label={t('fullName')}
          name="fullName"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
          icon={<UserRound />}
        />
      )}
      {mode !== 'forgot' && (
        <Input
          label={t('password')}
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
          minLength={mode === 'login' ? 1 : 10}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<LockKeyhole />}
        />
      )}
      {(mode === 'invite' || mode === 'reset') && (
        <ul className="stack caption" style={{ gap: 4, padding: 0, listStyle: 'none' }}>
          {[
            ['length', 'ruleLength'],
            ['number', 'ruleNumber'],
            ['uncommon', 'ruleCommon'],
          ].map(([key, label]) => (
            <li
              className="row"
              key={key}
              style={{
                gap: 8,
                color: rules[key as keyof typeof rules] ? 'var(--color-text-success)' : undefined,
              }}
            >
              <Check size={14} />
              {t(label)}
            </li>
          ))}
        </ul>
      )}
      {mode === 'login' && (
        <Link href="/forgot" style={{ textAlign: 'right' }}>
          {t('forgot')}
        </Link>
      )}
      {mode === 'invite' && (
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Checkbox
            id="terms"
            name="terms"
            checked={terms}
            onCheckedChange={(v) => setTerms(v === true)}
            required
          />
          <div className="stack" style={{ gap: 4 }}>
            <label htmlFor="terms">{t('termsLabel')}</label>
            <div className="row caption">
              <Link href="/terms" target="_blank">
                {c('terms')}
              </Link>
              <Link href="/privacy" target="_blank">
                {c('privacy')}
              </Link>
            </div>
          </div>
        </div>
      )}
      <Button
        size="lg"
        className="full"
        disabled={
          pending ||
          (mode === 'invite' && (!terms || !Object.values(rules).every(Boolean))) ||
          (mode === 'reset' && !Object.values(rules).every(Boolean))
        }
      >
        {mode === 'invite' && <ArrowRight />}
        {pending
          ? c('pending')
          : t(
              ({ login: 'signIn', forgot: 'sendReset', invite: 'create', reset: 'reset' } as const)[
                mode
              ],
            )}
      </Button>
      {mode === 'login' && (
        <p className="muted" style={{ textAlign: 'center' }}>
          {t('noAccount')}
        </p>
      )}
    </form>
  );
}
