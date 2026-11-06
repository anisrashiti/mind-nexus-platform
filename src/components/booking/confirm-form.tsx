'use client';
import { useActionState, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Check, FileText } from 'lucide-react';
import { Checkbox } from '@/components/ui/controls';
import { Button, Note } from '@/components/ui/primitives';
import { confirmBooking } from '@/lib/booking/actions';
export function ConfirmForm({ start }: { start: string }) {
  const t = useTranslations('booking');
  const c = useTranslations('common');
  const [state, action, pending] = useActionState(confirmBooking, {});
  const [consent, setConsent] = useState(false);
  return (
    <form action={action} className="stack confirm-form">
      <input type="hidden" name="start" value={start} />
      <section className="card stack">
        <h3>{t('before')}</h3>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="row" style={{ alignItems: 'flex-start' }}>
            <Check style={{ color: 'var(--color-text-brand)' }} />
            <p>{t(`bullet${i}`)}</p>
          </div>
        ))}
        <Link href="/consent" target="_blank" className="row">
          <FileText />
          {t('readConsent')}
        </Link>
      </section>
      {state.error && (
        <div role="alert">
          <Note tone="danger">{t(state.error)}</Note>
        </div>
      )}
      <div className="confirm-actions stack" style={{ gap: 20 }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <Checkbox
            id="consent"
            name="consent"
            checked={consent}
            required
            onCheckedChange={(v) => setConsent(v === true)}
          />
          <label htmlFor="consent">{t('agree')}</label>
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <Link className="btn btn-secondary btn-lg confirm-back" href="/book">
            {c('back')}
          </Link>
          <Button size="lg" className="confirm-submit" disabled={!consent || pending}>
            <Check />
            {pending ? c('pending') : t('confirm')}
          </Button>
        </div>
      </div>
    </form>
  );
}
