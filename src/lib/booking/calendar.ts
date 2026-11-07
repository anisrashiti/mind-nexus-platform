import { createTranslator } from 'next-intl';
import messages from '../../../messages/en.json';
const stamp = (value: Date) =>
  value
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
/** RFC 5545 TEXT escaping for backslashes, semicolons, commas and newlines. */
const text = (value: string) => value.replace(/[\\;,]/g, '\\$&').replace(/\r?\n/g, '\\n');
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
    `SUMMARY:${text(t('common.brand'))}`,
    `DESCRIPTION:${text(t('booking.whereValue'))}`,
    'CLASS:PRIVATE',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
