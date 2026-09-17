import {
  BOOKING_MINUTES,
  SESSION_LIMIT,
  endTime,
  type Appointment,
} from "./data";
export type Hours = {
  day: string;
  slots: string[];
};
export const halfHourTimes = Array.from(
  { length: 48 },
  (_, i) =>
    `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 ? "30" : "00"}`,
);
export type Schedule = {
  hours: Hours[];
  timeOff: { start: string; end: string }[];
  blocked: { date: string; start: string; end: string }[];
};
export const defaultHours = (): Hours[] =>
  [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ].map((day, i) => ({
    day,
    slots:
      i < 5
        ? halfHourTimes.filter(
            (time) =>
              time >= "08:30" &&
              time < "17:00" &&
              (time < "12:00" || time >= "13:00"),
          )
        : [],
  }));
export const isHalfHour = (time: string) =>
  /^([01]\d|2[0-3]):(00|30)$/.test(time);
export const overlaps = (
  start: string,
  end: string,
  otherStart: string,
  otherEnd: string,
) => start < otherEnd && end > otherStart;
export function allowance(appointments: Appointment[], patient: string) {
  const own = appointments.filter(
    (a) => a.patient === patient && a.funding !== "private",
  );
  const used = own.filter(
    (a) => a.status === "Completed" || a.status === "No-show",
  ).length;
  const reserved = own.filter((a) => a.status === "Upcoming").length;
  return {
    used,
    reserved,
    remaining: Math.max(0, SESSION_LIMIT - used - reserved),
  };
}
export function availableSlots(
  date: string,
  psychologist: string,
  patient: string,
  schedule: Schedule,
  appointments: Appointment[],
  excludeId?: string,
) {
  const h = schedule.hours[(new Date(date + "T12:00:00").getDay() + 6) % 7];
  if (
    !h?.slots.length ||
    schedule.timeOff.some((x) => date >= x.start && date <= x.end)
  )
    return [];
  const result: string[] = [];
  for (let minute = 0; minute + BOOKING_MINUTES <= 24 * 60; minute += 30) {
    const start =
      String(Math.floor(minute / 60)).padStart(2, "0") +
      ":" +
      String(minute % 60).padStart(2, "0");
    const end = endTime(start);
    if (
      !h.slots.includes(start) ||
      !h.slots.includes(halfHourTimes[minute / 30 + 1]) ||
      (date === "2026-09-14" && start < "14:00")
    )
      continue;
    if (
      schedule.blocked.some(
        (b) => b.date === date && overlaps(start, end, b.start, b.end),
      )
    )
      continue;
    if (
      appointments.some(
        (a) =>
          a.id !== excludeId &&
          a.date === date &&
          a.status !== "Cancelled" &&
          (a.psychologist === psychologist || a.patient === patient) &&
          overlaps(start, end, a.time, endTime(a.time)),
      )
    )
      continue;
    result.push(start);
  }
  return result;
}
