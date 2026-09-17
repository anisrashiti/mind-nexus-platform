import { test, expect } from "@playwright/test";
import {
  availableSlots,
  allowance,
  defaultHours,
  halfHourTimes,
  isHalfHour,
  overlaps,
} from "../lib/scheduling";
import {
  endTime,
  initialAppointments,
  psychologists,
  type Appointment,
} from "../lib/data";

const schedule = () => ({ hours: defaultHours(), timeOff: [], blocked: [] });
const reservation: Appointment = {
  id: "test",
  patient: "other",
  psychologist: psychologists[0],
  date: "2026-09-15",
  time: "10:00",
  service: "Consultation",
  status: "Upcoming",
};

test("individual blocks allow gaps and weekends but isolated half-hours cannot be booked", () => {
  const availability = schedule();
  availability.hours[1].slots = ["09:00", "09:30", "10:30", "13:00", "13:30"];
  expect(
    availableSlots("2026-09-15", psychologists[0], "MN-1042", availability, []),
  ).toEqual(["09:00", "13:00"]);
  availability.hours[5].slots = ["18:00", "18:30"];
  expect(
    availableSlots("2026-09-19", psychologists[0], "MN-1042", availability, []),
  ).toEqual(["18:00"]);
  availability.hours[5].slots = [];
  expect(
    availableSlots("2026-09-19", psychologists[0], "MN-1042", availability, []),
  ).toEqual([]);
});

test("timetable supports keyboard toggles, saving, localization and mobile scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Psychologist", exact: true }).click();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "Availability", exact: true })
    .click();
  await expect(page.locator(".availability-timetable tbody tr")).toHaveCount(
    48,
  );
  const cell = page.getByRole("button", {
    name: "Saturday 18:00",
    exact: true,
  });
  await expect(cell).toHaveAttribute("aria-pressed", "false");
  await cell.focus();
  await page.keyboard.press("Space");
  await expect(cell).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "SQ", exact: true }).click();
  await expect(page.getByRole("region", { name: "Orari javor" })).toBeVisible();
  await page.getByRole("button", { name: "EN", exact: true }).click();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "Today", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Open navigation", exact: true })
    .click();
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name: "Availability", exact: true })
    .click();
  await expect(cell).toHaveAttribute("aria-pressed", "true");
  await cell.click();
  await expect(cell).toHaveAttribute("aria-pressed", "false");
});

test("hour-long reservations exclude partial overlaps, including the buffer", () => {
  expect(endTime("10:30")).toBe("11:30");
  const slots = availableSlots(
    reservation.date,
    psychologists[0],
    "MN-1042",
    schedule(),
    [reservation],
  );
  expect(slots).toContain("09:00");
  expect(slots).not.toContain("09:30");
  expect(slots).not.toContain("10:00");
  expect(slots).not.toContain("10:30");
  expect(slots).toContain("11:00");
  expect(overlaps("10:50", "11:50", "10:00", endTime("10:00"))).toBe(true);
  expect(
    availableSlots(reservation.date, psychologists[1], "MN-1042", schedule(), [
      reservation,
    ]),
  ).toContain("10:00");
  expect(
    availableSlots(reservation.date, psychologists[1], "other", schedule(), [
      reservation,
    ]),
  ).not.toContain("10:30");
  expect(
    availableSlots(
      reservation.date,
      psychologists[0],
      "MN-1042",
      schedule(),
      [reservation],
      "test",
    ),
  ).toContain("10:00");
  expect(
    availableSlots(reservation.date, psychologists[0], "MN-1042", schedule(), [
      { ...reservation, status: "Cancelled" },
    ]),
  ).toContain("10:00");
});

test("half-hour availability respects full-slot boundaries, breaks, time off and blocks", () => {
  expect(isHalfHour("09:30")).toBe(true);
  expect(isHalfHour("09:15")).toBe(false);
  expect(isHalfHour("")).toBe(false);
  const availability = schedule();
  availability.hours[1] = {
    ...availability.hours[1],
    slots: halfHourTimes.filter(
      (t) => t >= "09:30" && t < "16:30" && (t < "12:30" || t >= "13:30"),
    ),
  };
  const slots = availableSlots(
    reservation.date,
    psychologists[0],
    "MN-1042",
    availability,
    [],
  );
  expect(slots[0]).toBe("09:30");
  expect(slots).toContain("11:30");
  expect(slots).not.toContain("12:00");
  expect(slots).not.toContain("13:00");
  expect(slots).toContain("13:30");
  expect(slots.at(-1)).toBe("15:30");
  expect(
    availableSlots(
      reservation.date,
      psychologists[0],
      "MN-1042",
      {
        ...availability,
        timeOff: [{ start: reservation.date, end: reservation.date }],
      },
      [],
    ),
  ).toEqual([]);
  const blocked = availableSlots(
    reservation.date,
    psychologists[0],
    "MN-1042",
    {
      ...availability,
      blocked: [{ date: reservation.date, start: "14:30", end: "15:00" }],
    },
    [],
  );
  expect(blocked).not.toContain("14:00");
  expect(blocked).toContain("15:00");
});

test("three-session accounting and seed appointments are consistent", () => {
  expect(
    allowance(
      [
        ...initialAppointments,
        { ...reservation, patient: "MN-1042", funding: "private" },
      ],
      "MN-1042",
    ),
  ).toEqual({ used: 1, reserved: 1, remaining: 1 });
  expect(allowance(initialAppointments, "MN-1042")).toEqual({
    used: 1,
    reserved: 1,
    remaining: 1,
  });
  const full = [...initialAppointments, { ...reservation, patient: "MN-1042" }];
  expect(allowance(full, "MN-1042").remaining).toBe(0);
  expect(
    allowance(
      full.map((a) => (a.id === "test" ? { ...a, status: "Cancelled" } : a)),
      "MN-1042",
    ).remaining,
  ).toBe(1);
  expect(
    allowance(
      full.map((a) => (a.id === "test" ? { ...a, status: "No-show" } : a)),
      "MN-1042",
    ),
  ).toEqual({ used: 2, reserved: 1, remaining: 0 });
  for (const a of initialAppointments.filter((a) => a.status !== "Cancelled")) {
    expect(isHalfHour(a.time)).toBe(true);
    expect(
      initialAppointments.some(
        (b) =>
          b.id !== a.id &&
          b.date === a.date &&
          b.status !== "Cancelled" &&
          b.psychologist === a.psychologist &&
          overlaps(a.time, endTime(a.time), b.time, endTime(b.time)),
      ),
    ).toBe(false);
    expect(
      allowance(initialAppointments, a.patient).used +
        allowance(initialAppointments, a.patient).reserved,
    ).toBeLessThanOrEqual(3);
  }
});
