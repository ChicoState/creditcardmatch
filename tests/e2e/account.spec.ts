import { expect, test } from '@playwright/test';

test('account edits persist and username login stays unchanged', async ({
  page,
}) => {
  const username = `Account_${Date.now().toString(36)}`;
  await page.goto('/account');
  await expect(page).toHaveURL('/login');
  await page.goto('/signup');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('accounttest1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/account');
  await expect(page.getByText('No email added')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Account name', exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Change password' }).click();
  await page
    .getByLabel('Current password', { exact: true })
    .fill('wrongpassword1');
  await page
    .getByLabel('New password', { exact: true })
    .fill('changedpassword2');
  await page
    .getByLabel('Confirm new password', { exact: true })
    .fill('changedpassword2');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /current password is incorrect/i }),
  ).toContainText('current password is incorrect');
  await page
    .getByLabel('Current password', { exact: true })
    .fill('accounttest1');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Password saved.')).toBeVisible();
  const renamed = `${username}_new`;
  await page.getByRole('button', { name: 'Change username' }).click();
  await page.getByLabel('New username', { exact: true }).fill(renamed);
  await page
    .getByLabel('Current password', { exact: true })
    .fill('changedpassword2');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Username saved.')).toBeVisible();
  await page.getByRole('button', { name: 'Change email' }).click();
  await page.getByLabel('New contact email').fill('contact@example.com');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Contact email saved.')).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('contact@example.com', { exact: true }),
  ).toBeVisible();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.locator('summary[aria-label="Open account menu"]').click();
  await expect(
    page.getByRole('group', { name: 'Account menu' }).getByText(renamed),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill(renamed);
  await page.getByLabel('Password', { exact: true }).fill('changedpassword2');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/account');
  await expect(page.getByText(renamed, { exact: true }).last()).toBeVisible();
  await expect(
    page.getByText('contact@example.com', { exact: true }),
  ).toBeVisible();
});
