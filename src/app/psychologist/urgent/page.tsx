import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { Phone, Mail, CalendarDays, Info } from 'lucide-react';
import { requirePsychologist } from '@/lib/auth/guards';
import { urgentInbox } from '@/lib/urgent/queries';
import { Avatar, Badge, Note } from '@/components/ui/primitives';
import { displayDate, displayTime } from '@/lib/dates';
import { HandleMessage } from '@/components/psychologist/handle-message';
export default async function Urgent({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const actor = await requirePsychologist();
  const params = await searchParams;
  const selected = z.uuid().safeParse(params.message);
  const inbox = await urgentInbox(actor.id, selected.success ? selected.data : undefined);
  const t = await getTranslations();
  const d = inbox.detail;
  return (
    <div className="stack" style={{ gap: 24 }}>
      <div className="stack" style={{ gap: 8 }}>
        <h1>{t('psychologist.urgent')}</h1>
        <p className="muted">{t('urgent.inboxDescription')}</p>
      </div>
      <section className="card urgent-inbox">
        <nav aria-label={t('psychologist.urgent')} className="urgent-list">
          {inbox.messages.length ? (
            inbox.messages.map((message) => (
              <Link
                prefetch={false}
                href={`/psychologist/urgent?message=${message.id}`}
                className="urgent-list-item"
                aria-current={d?.id === message.id ? 'true' : undefined}
                key={message.id}
              >
                <Avatar name={message.name} size="sm" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row between">
                    <strong>{message.name}</strong>
                    <Badge tone={message.handled ? 'neutral' : 'danger'}>
                      {t(message.handled ? 'status.handled' : 'status.new')}
                    </Badge>
                  </div>
                  <p className="caption preview">{message.preview}</p>
                  <p className="caption">
                    {displayDate(message.createdAt, 'd MMM')}, {displayTime(message.createdAt)}
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <p className="muted">{t('urgent.empty')}</p>
          )}
        </nav>
        {d ? (
          <article className="stack urgent-detail">
            <div className="row">
              <Avatar name={d.name} />
              <div style={{ flex: 1 }}>
                <h2>{d.name}</h2>
                <p className="caption">
                  {d.organization} · {displayDate(d.createdAt, 'd MMM')}, {displayTime(d.createdAt)}
                </p>
              </div>
              <Badge tone={d.handled ? 'neutral' : 'danger'}>
                {t(d.handled ? 'status.handled' : 'status.new')}
              </Badge>
            </div>
            <div className="note" style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {d.body}
            </div>
            <dl className="detail-list">
              {d.phone && (
                <>
                  <dt className="row">
                    <Phone />
                    {t('urgent.phone')}
                  </dt>
                  <dd>{d.phone}</dd>
                </>
              )}
              <dt className="row">
                <Mail />
                {t('common.email')}
              </dt>
              <dd style={{ overflowWrap: 'anywhere' }}>{d.email}</dd>
              <dt className="row">
                <CalendarDays />
                {t('urgent.next')}
              </dt>
              <dd>
                {d.next ? `${displayDate(d.next)} · ${displayTime(d.next)}` : t('urgent.noNext')}
              </dd>
            </dl>
            <div className="row wrap">
              {d.phone && (
                <a href={`tel:${d.phone.replace(/[^+\d]/g, '')}`} className="btn btn-primary">
                  <Phone />
                  {t('urgent.call')}
                </a>
              )}
              <a href={`mailto:${d.email}`} className="btn btn-secondary">
                <Mail />
                {t('urgent.email')}
              </a>
              <div style={{ flex: 1 }} />
              {!d.handled && <HandleMessage id={d.id} />}
            </div>
            <Note tone="accent" icon={<Info />}>
              {t('urgent.safety')}
            </Note>
          </article>
        ) : (
          <div className="empty muted">{t('urgent.select')}</div>
        )}
      </section>
    </div>
  );
}
