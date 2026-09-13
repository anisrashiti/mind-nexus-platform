import { test, expect, type Page } from "@playwright/test";
const roles = [
  "Patient / Employee",
  "Psychologist",
  "Organization Admin",
  "Mind Nexus Admin",
];
async function login(page: Page, role: string) {
  await page.goto("/");
  await page.getByRole("button", { name: role, exact: true }).click();
}
async function nav(page: Page, name: string) {
  await page
    .locator(".sidebar nav")
    .getByRole("button", { name, exact: true })
    .click();
}
async function switchRole(page: Page, role: string) {
  await page
    .getByRole("button", { name: "Demo role switcher", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: role, exact: false })
    .click();
}
test("All role navigation renders, bilingual shell, notifications, privacy boundary", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const role of roles) {
    await login(page, role);
    const names = await page.locator(".sidebar nav button").allTextContents();
    for (const name of names) {
      await page
        .locator(".sidebar nav button")
        .filter({ hasText: name })
        .first()
        .click();
      await expect(page.locator("main")).not.toBeEmpty();
      if (role === "Organization Admin") {
        await expect(page.locator("main")).not.toContainText("Session note");
        await expect(page.locator("main")).not.toContainText("MN-1042");
      }
    }
    await page.getByRole("button", { name: "SQ", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "sq");
    await expect(page.locator(".sidebar nav")).toContainText(
      role === "Patient / Employee" ? "Profili" : "Cilësimet",
    );
    await page.getByRole("button", { name: "EN", exact: true }).click();
    await page
      .getByRole("button", { name: "Notifications", exact: true })
      .click();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.getByText("You’re all caught up.")).toBeVisible();
    await page.getByRole("button", { name: "Close notifications" }).click();
  }
  expect(errors).toEqual([]);
});
test("Patient cancellation, booking, reschedule, room and cross-role messaging", async ({
  page,
}) => {
  await login(page, roles[0]);
  await nav(page, "Appointments");
  await page
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Cancel appointment", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Book a session", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "09:00", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your session has been booked." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View appointments" }).click();
  await page
    .getByRole("button", { name: "Reschedule", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "10:30", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm appointment", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your session has been rescheduled." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "View appointments" }).click();
  await nav(page, "Messages");
  await page
    .getByRole("textbox", { name: "Write a message…" })
    .fill("Thank you. See you at our next appointment.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message-history")).toContainText(
    "Thank you. See you at our next appointment.",
  );
  await switchRole(page, roles[1]);
  await nav(page, "Messages");
  await expect(page.locator(".message-history")).toContainText(
    "Thank you. See you at our next appointment.",
  );
  await page
    .getByRole("textbox", { name: "Write a message…" })
    .fill("You are welcome, Arta.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await switchRole(page, roles[0]);
  await nav(page, "Messages");
  await expect(page.locator(".message-history")).toContainText(
    "You are welcome, Arta.",
  );
});
test("Patient wellbeing and simulated video controls", async ({ page }) => {
  await login(page, roles[0]);
  await page.getByRole("button", { name: "Join session", exact: true }).click();
  await page.getByRole("button", { name: "Enter waiting room" }).click();
  await expect(
    page.getByText("You are in the simulated session."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Microphone", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Microphone", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Camera", exact: true }).click();
  await page.getByRole("button", { name: "End session", exact: true }).click();
  await nav(page, "Well-being");
  await page.getByRole("slider").first().fill("5");
  await page
    .getByRole("button", { name: "Submit check-in", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check-in completed." }),
  ).toBeVisible();
  await switchRole(page, roles[1]);
  await nav(page, "Assessments");
  await page
    .getByRole("button", { name: "View responses", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText("5 / 5");
});
test("Clinician patient search, draft and signed note, availability and calendar block", async ({
  page,
}) => {
  await login(page, roles[1]);
  await nav(page, "Patients");
  await page.getByRole("textbox", { name: "Search patients" }).fill("Arta");
  await page
    .getByRole("button", { name: "Arta Krasniqi", exact: true })
    .click();
  await page.getByRole("button", { name: "New note", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Session note", exact: true })
    .fill("Fictional review note for a local prototype session.");
  await page.getByRole("button", { name: "Save draft" }).click();
  await page.getByRole("tab", { name: "Notes", exact: true }).click();
  await expect(page.locator("main")).toContainText("Fictional review note");
  await page
    .locator(".note-record")
    .filter({ hasText: "Fictional review note" })
    .getByRole("button", { name: "Continue note" })
    .click();
  await page
    .getByRole("button", { name: "Complete note", exact: true })
    .click();
  await expect(
    page.locator(".note-record").filter({ hasText: "Fictional review note" }),
  ).toContainText("Completed / Signed");
  await nav(page, "Availability");
  await page.getByLabel("Tuesday start", { exact: true }).fill("10:00");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await nav(page, "Calendar");
  await page.getByRole("button", { name: "Block time" }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.locator(".calendar-block")).toContainText("10:00");
  await nav(page, "Availability");
  await expect(page.getByLabel("Tuesday start", { exact: true })).toHaveValue(
    "10:00",
  );
});
test("Organization eligibility add/deactivate/import, report excludes clinical data", async ({
  page,
}) => {
  await login(page, roles[2]);
  await nav(page, "Eligibility");
  await page.getByRole("button", { name: "Add employee", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Bora Dervishi");
  await page
    .getByRole("textbox", { name: "Work email", exact: true })
    .fill("bora@aurora.example");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add employee", exact: true })
    .click();
  const row = page.getByRole("row").filter({ hasText: "Bora Dervishi" });
  await row.getByRole("button", { name: "Deactivate", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Deactivate", exact: true })
    .click();
  await expect(row).toContainText("Inactive");
  await page.getByRole("button", { name: "Upload CSV" }).click();
  await page
    .getByRole("textbox", { name: "Or paste CSV" })
    .fill(
      "name,email,department\nFlora Dervishi,flora@aurora.example,Operations",
    );
  await page.getByRole("button", { name: "Import employees" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "Flora Dervishi" }),
  ).toBeVisible();
  await nav(page, "Reports");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("aggregate");
  await expect(page.locator("main")).not.toContainText("Arta");
  await expect(page.locator("main")).not.toContainText("MN-1042");
});
test("Admin assignment, services, search and audit", async ({ page }) => {
  await login(page, roles[3]);
  await nav(page, "Assignments");
  await page
    .locator(".assignment-row")
    .filter({ hasText: "Elira Shala" })
    .getByRole("button", { name: "Assign psychologist" })
    .click();
  await expect(
    page.locator(".assignment-row").filter({ hasText: "Elira Shala" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: "Elira Shala" }),
  ).toContainText("Dr. Luljeta Berisha");
  await nav(page, "Audit Log");
  await expect(page.locator("table")).toContainText("Assigned psychologist");
  await nav(page, "Services");
  await page.getByRole("button", { name: "Edit", exact: true }).first().click();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Individual Psychological Consultation — Demo");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator("main")).toContainText(
    "Individual Psychological Consultation — Demo",
  );
  await nav(page, "Appointments");
  await page
    .getByRole("textbox", { name: "Search", exact: true })
    .last()
    .fill("Arta");
  await expect(page.locator("tbody")).not.toContainText("Besnik");
});
test("Mobile patient layout, messages, navigation and visual references", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, roles[0]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "artifacts/patient-mobile.png",
    fullPage: true,
  });
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "Messages", exact: true })
    .click();
  await page.locator(".conversation-list>button").first().click();
  await page
    .getByRole("textbox", { name: "Write a message…" })
    .fill("A mobile demo message.");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator(".message-history")).toContainText(
    "A mobile demo message.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await login(page, roles[1]);
  await page.screenshot({
    path: "artifacts/psychologist-desktop.png",
    fullPage: true,
  });
  await login(page, roles[2]);
  await page.screenshot({
    path: "artifacts/organization-desktop.png",
    fullPage: true,
  });
  await login(page, roles[0]);
  await page.screenshot({
    path: "artifacts/patient-desktop.png",
    fullPage: true,
  });
  await page.goto("/");
  await page.screenshot({
    path: "artifacts/login-desktop.png",
    fullPage: true,
  });
});
