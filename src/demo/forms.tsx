'use client';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowRight, KeyRound, RotateCcw } from 'lucide-react';
import { Button, Input } from '@/components/ui/primitives';
import { Dialog, DialogContent, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { unlockDemo, enterDemo, resetDemo, type DemoState } from './actions';
import type { DemoView } from './config';

function ErrorMessage({ state }: { state: DemoState }) {
  const t = useTranslations('demo');
  return state.error ? (
    <p role="alert" className="field-error">
      {t(state.error)}
    </p>
  ) : null;
}
export function DemoAccessForm() {
  const t = useTranslations('demo');
  const [state, action, pending] = useActionState(unlockDemo, {});
  return (
    <form action={action} className="stack">
      <Input
        name="code"
        type="password"
        label={t('accessCode')}
        icon={<KeyRound />}
        required
        maxLength={256}
        autoComplete="off"
      />
      <ErrorMessage state={state} />
      <Button type="submit" size="lg" disabled={pending}>
        {t(pending ? 'opening' : 'open')}
        <ArrowRight />
      </Button>
    </form>
  );
}
export function DemoViewButton({ view, disabled }: { view: DemoView; disabled: boolean }) {
  const t = useTranslations('demo');
  const [state, action, pending] = useActionState(enterDemo, {});
  return (
    <form action={action} className="stack" style={{ marginTop: 'auto' }}>
      <input type="hidden" name="view" value={view} />
      <ErrorMessage state={state} />
      <Button
        type="submit"
        disabled={disabled || pending}
        aria-label={t('viewAction', { view: t(`views.${view}.title`) })}
      >
        {t(pending ? 'opening' : 'view')}
        <ArrowRight />
      </Button>
    </form>
  );
}
export function DemoResetButton({ disabled = false }: { disabled?: boolean }) {
  const t = useTranslations('demo');
  const common = useTranslations('common');
  const [state, action, pending] = useActionState(resetDemo, {});
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" disabled={disabled}>
          <RotateCcw />
          {t('reset')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('resetTitle')} description={t('resetDescription')}>
        <form action={action} className="stack">
          <input type="hidden" name="intent" value="reset" />
          <ErrorMessage state={state} />
          <div className="row wrap" style={{ justifyContent: 'flex-end' }}>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={pending}>
                {common('cancel')}
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {t(pending ? 'resetting' : 'reset')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
