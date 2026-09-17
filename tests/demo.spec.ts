import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function enter(p: Page, role = "Employee") {
  await p.goto("/");
  await p.getByRole("button", { name: role, exact: true }).click();
}
async function onboard(p: Page, doctor = 0) {
  await p.getByRole("button", { name: "Get started", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await p.getByRole("checkbox").check();
  await p.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(p.locator(".care-card")).toHaveCount(4);
  await p
    .locator(".care-card")
    .nth(doctor)
    .getByRole("button", { name: "Choose psychologist", exact: true })
    .click();
  await p.getByRole("button", { name: "Go to Home", exact: true }).click();
}
async function nav(p: Page, name: string) {
  const mobile = (p.viewportSize()?.width ?? 1440) <= 640;
  if (mobile && (await p.locator(".role-patient").count()))
    await p
      .locator(".bottom-nav")
      .getByRole("button", { name, exact: true })
      .click();
  else {
    if (mobile)
      await p
        .getByRole("button", { name: "Open navigation", exact: true })
        .click();
    await p
      .locator(".sidebar nav")
      .getByRole("button", { name, exact: true })
      .click();
  }
}
async function role(p: Page, name: string) {
  await p
    .getByRole("button", { name: "Demo role switcher", exact: true })
    .click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name: new RegExp(`^${name}`) })
    .click();
}
async function account(p: Page, name: string) {
  await p.getByRole("button", { name: "Account", exact: true }).click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click();
}
async function noOverflow(p: Page) {
  await expect
    .poll(() =>
      p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
    )
    .toBe(true);
}
async function book(p: Page, time = "10:00–11:00") {
  await nav(p, "Sessions");
  await p.getByRole("button", { name: "Book a session", exact: true }).click();
  await p.getByRole("button", { name: time, exact: true }).click();
  await p
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await p
    .getByRole("button", { name: "View appointments", exact: true })
    .click();
}

test("chosen psychologist availability, calendar blocks and dialog keyboard focus", async ({
  page: p,
}) => {
  await enter(p);
  await onboard(p, 1);
  await role(p, "Psychologist");
  await expect(p.locator(".page-header")).toContainText("Dr. Erion Gashi");
  await nav(p, "Availability");
  await p.getByRole("button", { name: "Tuesday 08:30", exact: true }).click();
  await p.getByRole("button", { name: "Tuesday 09:00", exact: true }).click();
  await p.getByRole("button", { name: "Save changes", exact: true }).click();
  await nav(p, "Calendar");
  await expect(p.locator(".calendar-available").first()).toBeVisible();
  await p.getByRole("button", { name: "Block time", exact: true }).click();
  await p.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(p.locator(".calendar-block")).toContainText("10:00");
  await role(p, "Employee");
  await nav(p, "Sessions");
  const opener = p.getByRole("button", { name: "Book a session", exact: true });
  await opener.click();
  await expect(
    p.getByRole("button", { name: "08:30–09:30", exact: true }),
  ).toHaveCount(0);
  await expect(
    p.getByRole("button", { name: "09:30–10:30", exact: true }),
  ).toHaveCount(0);
  await expect(
    p.getByRole("button", { name: "11:00–12:00", exact: true }),
  ).toBeVisible();
  await p.keyboard.press("Escape");
  await expect(opener).toBeFocused();
  await p.getByRole("tab", { name: "Upcoming", exact: true }).focus();
  await p.keyboard.press("ArrowRight");
  await expect(
    p.getByRole("tab", { name: "Past", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
});

test("chosen care, reservations, private continuation, rescheduling, cancellation and reload", async ({
  page: p,
}) => {
  await enter(p);
  await onboard(p, 1);
  await expect(p.locator(".care-card")).toContainText("Dr. Erion Gashi");
  await nav(p, "Sessions");
  await p.getByRole("button", { name: "Book a session", exact: true }).click();
  await expect(p.getByRole("dialog")).toContainText(
    "Book with Dr. Erion Gashi",
  );
  await expect(p.locator(".psychologist-options")).toHaveCount(0);
  await p.getByRole("button", { name: "10:00–11:00", exact: true }).click();
  await p
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await expect(
    p.getByRole("heading", { name: "Your session is booked." }),
  ).toBeVisible();
  await p
    .getByRole("button", { name: "View appointments", exact: true })
    .click();
  await p.getByRole("button", { name: "Book a session", exact: true }).click();
  await expect(p.getByRole("dialog")).toContainText("complete or reserved");
  await p
    .getByRole("button", { name: "Continue privately", exact: true })
    .click();
  await expect(p.getByRole("dialog").last()).toContainText(
    "No payment is collected",
  );
  await p
    .getByRole("button", { name: "Register interest in this demo" })
    .click();
  await expect(p.getByRole("status")).toContainText("No request was sent");
  await p.keyboard.press("Escape");
  await p.keyboard.press("Escape");
  await p
    .locator(".appointment-row")
    .filter({ hasText: "10:00–11:00" })
    .getByRole("button", { name: "Reschedule", exact: true })
    .click();
  await p.getByRole("button", { name: "11:00–12:00", exact: true }).click();
  await p
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await p
    .getByRole("button", { name: "View appointments", exact: true })
    .click();
  await p
    .locator(".appointment-row")
    .filter({ hasText: "11:00–12:00" })
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await nav(p, "Home");
  await expect(p.locator(".support-count strong")).toHaveText("1");
  await p.reload();
  await p.getByRole("button", { name: "Employee", exact: true }).click();
  await expect(p.locator(".care-card")).toContainText("Dr. Erion Gashi");
  await role(p, "Psychologist");
  await nav(p, "Clients");
  await expect(p.locator("tbody")).toContainText("Arta Krasniqi");
  await expect(p.locator("tbody")).not.toContainText("Besnik Hoxha");
});

test("messages, unscored reflections, simulated session, signed notes and admin separation", async ({
  page: p,
}) => {
  await enter(p);
  await onboard(p);
  await p.getByRole("button", { name: "Join session", exact: true }).click();
  await p.getByRole("button", { name: "Enter session", exact: true }).click();
  await expect(p.getByRole("dialog")).toContainText(
    "You are in the simulated session.",
  );
  await p.getByRole("button", { name: "Microphone", exact: true }).click();
  await expect(
    p.getByRole("button", { name: "Microphone", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await p.getByRole("button", { name: "End session", exact: true }).click();
  await nav(p, "Messages");
  await p
    .getByRole("textbox", { name: "Write a message…" })
    .fill("Fictional message between consultations.");
  await p.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(p.locator(".message-history")).not.toContainText("✓✓");
  await p.getByRole("button", { name: "Need urgent help?" }).click();
  await expect(p.getByRole("dialog")).toContainText("not an emergency service");
  await p.keyboard.press("Escape");
  await nav(p, "Home");
  await p.getByRole("button", { name: "Take a moment to reflect" }).click();
  await p
    .getByRole("textbox")
    .first()
    .fill("Fictional reflection about boundaries.");
  await p
    .getByRole("button", { name: "Share reflection with my psychologist" })
    .click();
  await role(p, "Psychologist");
  await nav(p, "Messages");
  await expect(p.locator(".message-history")).toContainText(
    "Fictional message between consultations.",
  );
  await nav(p, "Clients");
  await p.getByRole("button", { name: "Arta Krasniqi", exact: true }).click();
  await p.getByRole("tab", { name: "Reflections", exact: true }).click();
  await expect(p.locator("main")).toContainText(
    "Fictional reflection about boundaries.",
  );
  await expect(p.locator("main")).not.toContainText("/ 100");
  await p.getByRole("button", { name: "New note", exact: true }).click();
  await p
    .getByRole("textbox", { name: "Session note", exact: true })
    .fill("Fictional private note for care continuity.");
  await p.getByRole("button", { name: "Save draft", exact: true }).click();
  await p.getByRole("tab", { name: "Notes", exact: true }).click();
  const n = p
    .locator(".note-record")
    .filter({ hasText: "Fictional private note" });
  await n.getByRole("button", { name: "Continue note" }).click();
  await p.getByRole("button", { name: "Complete note", exact: true }).click();
  await expect(n).toContainText("Completed / Signed");
  await role(p, "Mind Nexus");
  for (const name of [
    "Overview",
    "Program",
    "Employees",
    "Psychologists",
    "Sessions",
    "Reports",
  ]) {
    await nav(p, name);
    await expect(p.locator("main")).not.toContainText("Fictional private note");
    await expect(p.locator("main")).not.toContainText(
      "Fictional reflection about boundaries",
    );
    await expect(p.locator("main")).not.toContainText(
      "Fictional message between consultations",
    );
  }
});

test("program pool, report date filtering and aggregate-only CSV", async ({
  page: p,
}) => {
  await enter(p, "Mind Nexus");
  await expect(p.locator(".pool-numbers")).toContainText("126");
  await nav(p, "Reports");
  await p.getByLabel("To", { exact: true }).fill("2026-10-31");
  await p.getByLabel("From", { exact: true }).fill("2026-10-01");
  await p.getByRole("button", { name: "Generate report", exact: true }).click();
  await expect(p.locator(".report-metrics").last()).toHaveText(
    /0Completed0Reserved0Cancelled0No-show/,
  );
  const pending = p.waitForEvent("download");
  await p.getByRole("button", { name: "Export report", exact: true }).click();
  const download = await pending;
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain("2026-10-01");
  expect(csv).not.toMatch(/Arta|MN-1042|NOTE-|boundaries/);
  await role(p, "Employee");
  await onboard(p);
  await book(p);
  await role(p, "Mind Nexus");
  await expect(p.locator(".pool-numbers")).toContainText("367");
});

test("eligibility, CSV import, professional editing, change request and audit", async ({
  page: p,
}) => {
  await enter(p, "Mind Nexus");
  await nav(p, "Employees");
  await p.getByRole("button", { name: "Add employee", exact: true }).click();
  await p
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Bora Dervishi");
  await p
    .getByRole("textbox", { name: "Work email", exact: true })
    .fill("bora@aurora.example");
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Add employee", exact: true })
    .click();
  const row = p.getByRole("row").filter({ hasText: "Bora Dervishi" });
  await row.getByRole("button", { name: "Deactivate", exact: true }).click();
  await p
    .getByRole("dialog")
    .getByRole("button", { name: "Deactivate", exact: true })
    .click();
  await expect(row).toContainText("Inactive");
  await p.getByRole("button", { name: "Upload CSV" }).click();
  await p
    .getByRole("textbox", { name: "Or paste CSV" })
    .fill(
      "name,email,department\nFlora Dervishi,flora@aurora.example,Operations",
    );
  await p.getByRole("button", { name: "Import employees" }).click();
  await expect(p.locator("tbody")).toContainText("Flora Dervishi");
  await nav(p, "Psychologists");
  await p
    .getByRole("button", { name: "Dr. Luljeta Berisha", exact: true })
    .click();
  await p
    .getByRole("textbox", { name: "Professional bio", exact: true })
    .fill("Fictional profile edited by Mind Nexus.");
  await p.getByRole("button", { name: "Save changes", exact: true }).click();
  await role(p, "Employee");
  await onboard(p);
  await p.getByRole("button", { name: "View profile", exact: true }).click();
  await expect(p.getByRole("dialog")).toContainText("edited by Mind Nexus");
  await p.keyboard.press("Escape");
  await account(p, "Profile");
  await p.getByRole("button", { name: "Need to change psychologist?" }).click();
  await p
    .getByRole("button", { name: "Request a change in this demo" })
    .click();
  await expect(p.getByRole("dialog")).toContainText("No message was sent");
  await p.keyboard.press("Escape");
  await role(p, "Mind Nexus");
  await account(p, "Audit Log");
  await expect(p.locator("main")).toContainText("Updated psychologist profile");
});

test("every primary screen at 1440, 1280, 1024, 768 and 390 in SQ and EN", async ({
  page: p,
}) => {
  test.setTimeout(240000);
  const errors: string[] = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await enter(p);
  await onboard(p);
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const r of ["Employee", "Psychologist", "Mind Nexus"]) {
      await role(p, r);
      const pages =
        r === "Employee"
          ? ["Home", "Sessions", "Messages", "Resources"]
          : r === "Psychologist"
            ? ["Today", "Calendar", "Clients", "Messages", "Availability"]
            : [
                "Overview",
                "Program",
                "Employees",
                "Psychologists",
                "Sessions",
                "Reports",
              ];
      for (const target of pages) {
        await nav(p, target);
        await expect(p.locator("main")).not.toBeEmpty();
        await noOverflow(p);
        await p.getByRole("button", { name: "SQ", exact: true }).click();
        await expect(p.locator("html")).toHaveAttribute("lang", "sq");
        await noOverflow(p);
        if (target === pages[0])
          await p.screenshot({
            path: `artifacts/${r}-${width}-sq.png`,
            fullPage: true,
          });
        await p.getByRole("button", { name: "EN", exact: true }).click();
      }
    }
  }
  expect(errors).toEqual([]);
});

test("mobile onboarding, booking, account privacy and messaging", async ({
  page: p,
}) => {
  await p.setViewportSize({ width: 390, height: 844 });
  await enter(p);
  await noOverflow(p);
  await onboard(p);
  await expect(p.locator(".bottom-nav button")).toHaveCount(4);
  await nav(p, "Sessions");
  await p.getByRole("button", { name: "Book a session", exact: true }).click();
  await expect(p.getByRole("dialog")).toContainText("Europe/Prishtina");
  await expect(p.getByRole("dialog")).toContainText("50 minutes");
  await noOverflow(p);
  await p.keyboard.press("Escape");
  await nav(p, "Messages");
  await p.locator(".conversation-list > button").first().click();
  await p
    .getByRole("textbox", { name: "Write a message…" })
    .fill("A mobile demo message.");
  await p.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(p.locator(".message-history")).toContainText(
    "A mobile demo message.",
  );
  await noOverflow(p);
  await account(p, "Privacy");
  await expect(p.locator("main")).toContainText(
    "cannot see whether you book or attend",
  );
});
