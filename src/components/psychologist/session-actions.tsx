'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/primitives';
import { Dialog, DialogTrigger, DialogContent, DialogClose } from '@/components/ui/dialog';
import { decideOutcome, psychologistCancel } from '@/lib/psychologist/actions';
import { RefreshCw } from 'lucide-react';
export function OutcomeActions({ id }: { id: string }) {
  const t = useTranslations('psychologist');
  const c = useTranslations('common');
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  const decide = (decision: 'given_back' | 'kept') =>
    start(async () => {
      try {
        await decideOutcome({ id, decision });
      } catch {
        setError(true);
      }
    });
  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row wrap between">
        <p className="muted">{t('outcomePrompt')}</p>
        <div className="row wrap">
          <Button variant="ghost" disabled={pending} onClick={() => decide('kept')}>
            {t('keepUsed')}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => decide('given_back')}>
            <RefreshCw />
            {t('giveBack')}
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="field-error">
          {c('error')}
        </p>
      )}
    </div>
  );
}
export function PsychologistCancel({ id }: { id: string }) {
  const t = useTranslations('psychologist');
  const c = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" style={{ color: 'var(--color-text-danger)' }}>
          {c('cancel')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('cancelTitle')} description={t('cancelDescription')}>
        {error && (
          <p className="field-error" role="alert">
            {c('error')}
          </p>
        )}
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <DialogClose asChild>
            <Button variant="secondary">{c('back')}</Button>
          </DialogClose>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() =>
              start(async () => {
                try {
                  await psychologistCancel({ id });
                  setOpen(false);
                } catch {
                  setError(true);
                }
              })
            }
          >
            {c('cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
