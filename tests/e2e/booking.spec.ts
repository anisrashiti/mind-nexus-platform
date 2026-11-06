import { test, expect } from '@playwright/test';
test('employee signs in, consents, books and cancels with a refund', async ({ page, baseURL }) => {
  test.skip(
    !process.env.SEED_HR_PASSWORD || process.env.SEED_DEMO !== '1',
    'Requires isolated development seed',
  );
  expect(new URL(baseURL!).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
  await page.goto('/login');
  await page.getByLabel('Work email').fill('demo1@example.com');
  await page.getByLabel('Password', { exact: true }).fill(process.env.SEED_HR_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Book your session', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Book your session', exact: true }).click();
  const nextWeek = page.getByRole('button', { name: 'Next week', exact: true });
  if (await nextWeek.isEnabled()) await nextWeek.click();
  await page
    .getByRole('button', { name: /^\d{2}:\d{2}$/ })
    .first()
    .click();
  await page.getByRole('link', { name: 'Continue', exact: true }).click();
  const confirm = page.getByRole('button', { name: 'Confirm booking', exact: true });
  await expect(confirm).toBeDisabled();
  await page
    .getByRole('checkbox', {
      name: 'I have read and agree to the informed consent for online sessions.',
    })
    .check();
  await confirm.click();
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Join session', exact: true })).toBeDisabled();
  const response = await page.request.get(
    (await page.getByRole('link', { name: 'Add to calendar' }).getAttribute('href'))!,
  );
  expect(response.headers()['content-type']).toContain('text/calendar');
  expect(await response.text()).toContain('CLASS:PRIVATE');
  await page.getByRole('button', { name: 'Cancel session', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('You keep your session.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Cancel session', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Book your session', exact: true })).toBeVisible();
});
