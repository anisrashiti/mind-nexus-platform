'use client';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/primitives';
import { markUrgentHandled } from '@/lib/urgent/actions';
export function HandleMessage({ id }: { id: string }) {
  const t = useTranslations();
  const [pending, start] = useTransition();
  const [error, setError] = useState(false);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <Button
        variant="ghost"
        disabled={pending}
        onClick={() =>
          start(async () => {
            try {
              const result = await markUrgentHandled({ id });
              if (result.error) setError(true);
            } catch {
              setError(true);
            }
          })
        }
      >
        <Check />
        {pending ? t('common.pending') : t('urgent.handle')}
      </Button>
      {error && (
        <p className="field-error" role="alert">
          {t('common.error')}
        </p>
      )}
    </div>
  );
}
