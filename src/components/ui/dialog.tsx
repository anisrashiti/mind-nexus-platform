'use client';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({
  title,
  description,
  children,
  sheet = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  sheet?: boolean;
}) {
  const t = useTranslations('common');
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="dialog-overlay" />
      <DialogPrimitive.Content
        className={cn('dialog-content stack', sheet && 'sheet-mobile')}
        aria-describedby={description ? undefined : undefined}
      >
        <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
        <DialogPrimitive.Description className={description ? 'muted' : 'sr-only'}>
          {description ?? title}
        </DialogPrimitive.Description>
        {children}
        <DialogPrimitive.Close
          className="btn btn-ghost btn-icon dialog-close"
          aria-label={t('close')}
        >
          <X />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
export function SheetContent(props: Omit<Parameters<typeof DialogContent>[0], 'sheet'>) {
  return <DialogContent {...props} sheet />;
}
