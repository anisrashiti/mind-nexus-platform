import { createTranslator } from 'next-intl';
import messages from '../../../messages/en.json';
const stamp = (value: Date) =>
  value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
export function calendarFile(
  appointment: { id: string; startsAt: Date; endsAt: Date },
  now = new Date(),
) {
  const t = createTranslator({ locale: 'en', messages });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mind Nexus//Private Session//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${appointment.id}@mind-nexus`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(appointment.startsAt)}`,
    `DTEND:${stamp(appointment.endsAt)}`,
    `SUMMARY:${t('common.brand')}`,
    `DESCRIPTION:${t('booking.whereValue')}`,
    'CLASS:PRIVATE',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
