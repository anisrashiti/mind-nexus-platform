import { describe, it, expect } from 'vitest';
import { formatInTimeZone } from 'date-fns-tz';
import { generateSlots, type SlotInput } from './slot-engine';
import { localInstant } from '@/lib/dates';
const base: SlotInput = {
  rules: [{ weekday: 1, startTime: '09:00', endTime: '12:00' }],
  timeOff: [],
  appointments: [],
  fromDate: '2026-11-09',
  toDate: '2026-11-09',
  now: new Date('2026-11-06T10:00:00Z'),
};
const times = (input: Partial<SlotInput> = {}) =>
  generateSlots({ ...base, ...input }).map((d) => formatInTimeZone(d, 'Europe/Belgrade', 'HH:mm'));
describe('Kosovo booking slots', () => {
  it('generates 30-minute starts inside a range', () =>
    expect(times()).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']));
  it('10:00 blocks 10:00 and 10:30, preserves 11:00', () => {
    const result = times({
      appointments: [
        {
          startsAt: localInstant('2026-11-09', '10:00'),
          endsAt: localInstant('2026-11-09', '10:50'),
          status: 'confirmed',
        },
      ],
    });
    expect(result).not.toContain('10:00');
    expect(result).not.toContain('10:30');
    expect(result).toContain('11:00');
  });
  it('includes exact 12-hour boundary', () =>
    expect(times({ now: new Date('2026-11-08T20:30:00Z') })).toEqual([
      '09:30',
      '10:00',
      '10:30',
      '11:00',
    ]));
  it('includes exactly 28 days but no starts beyond', () =>
    expect(times({ now: new Date('2026-10-12T08:30:00Z') })).toEqual(['09:00', '09:30']));
  it('removes time-off overlaps', () =>
    expect(
      times({
        timeOff: [
          {
            startsAt: localInstant('2026-11-09', '09:45'),
            endsAt: localInstant('2026-11-09', '10:15'),
          },
        ],
      }),
    ).toEqual(['10:30', '11:00']));
  it('no 16:30 start in range ending at 17:00', () =>
    expect(times({ rules: [{ weekday: 1, startTime: '16:00', endTime: '17:00' }] })).toEqual([
      '16:00',
    ]));
  it('supports multiple ranges and deduplicates', () =>
    expect(
      times({
        rules: [...base.rules, ...base.rules, { weekday: 1, startTime: '13:00', endTime: '14:00' }],
      }),
    ).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '13:00']));
  it.each([
    ['2026-03-29', '2026-03-26T00:00:00Z', '07:00'],
    ['2026-10-25', '2026-10-22T00:00:00Z', '08:00'],
  ])('converts on DST weekend %s', (day, now, utc) => {
    const slots = generateSlots({
      ...base,
      fromDate: day,
      toDate: day,
      now: new Date(now),
      rules: [{ weekday: 7, startTime: '09:00', endTime: '12:00' }],
    });
    expect(slots[0].toISOString()).toContain(`T${utc}:00`);
    expect(slots).toHaveLength(5);
  });
  it('skips nonexistent spring wall times', () => {
    const starts = generateSlots({
      ...base,
      fromDate: '2026-03-29',
      toDate: '2026-03-29',
      now: new Date('2026-03-26T00:00Z'),
      rules: [{ weekday: 7, startTime: '01:00', endTime: '04:00' }],
    }).map((d) => formatInTimeZone(d, 'Europe/Belgrade', 'HH:mm'));
    expect(starts).not.toContain('02:00');
    expect(starts).not.toContain('02:30');
    expect(new Set(starts).size).toBe(starts.length);
  });
  it('cancelled appointments do not block', () =>
    expect(
      times({
        appointments: [
          {
            startsAt: localInstant('2026-11-09', '10:00'),
            endsAt: localInstant('2026-11-09', '10:50'),
            status: 'cancelled',
          },
        ],
      }),
    ).toEqual(times()));
});
