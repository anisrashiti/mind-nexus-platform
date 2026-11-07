'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Video } from 'lucide-react';
export function VideoRoom({
  room,
  endsAt,
  failed,
  home,
}: {
  room: string | null;
  endsAt: string;
  failed: boolean;
  home: string;
}) {
  const t = useTranslations();
  const [ended, setEnded] = useState(false);
  useEffect(() => {
    const remaining = +new Date(endsAt) - Date.now();
    const timer = setTimeout(() => setEnded(true), Math.max(0, remaining));
    return () => clearTimeout(timer);
  }, [endsAt]);
  if (ended)
    return (
      <section className="video-placeholder stack">
        <h1>{t('video.ended')}</h1>
        <Link href={home} className="btn btn-secondary">
          {t('common.goHome')}
        </Link>
      </section>
    );
  if (!room)
    return (
      <section className="video-placeholder stack">
        <Video size={40} />
        <h2>{t(failed ? 'video.unavailable' : 'video.placeholder')}</h2>
        {!failed && <p>{t('video.placeholderDescription')}</p>}
        <Link href={home} className="btn btn-secondary">
          {t('common.goHome')}
        </Link>
      </section>
    );
  return (
    <div className="video-frame">
      <iframe
        src={room}
        title={t('video.frameTitle')}
        allow="camera; microphone; fullscreen; speaker"
        referrerPolicy="no-referrer"
        allowFullScreen
      />
      <Link href={home} className="btn btn-danger video-leave">
        {t('video.leave')}
      </Link>
    </div>
  );
}
