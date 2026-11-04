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
  await page.getByRole('button', { name: 'Change name' }).click();
  await page.getByLabel('New account name').fill('Updated account');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Account name saved.')).toBeVisible();
  await expect(
    page.getByText('Updated account', { exact: true }).last(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Change email' }).click();
  await page.getByLabel('New contact email').fill('contact@example.com');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Contact email saved.')).toBeVisible();
  await page.reload();
  await expect(
    page.getByText('contact@example.com', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Change name' }).click();
  await page.getByLabel('New account name').fill('Unsaved name');
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(
    page.getByText('Updated account', { exact: true }).last(),
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
    page
      .getByRole('group', { name: 'Account menu' })
      .getByText('Updated account'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Log out' }).click();
  await page.goto('/login');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('accounttest1');
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/account');
  await expect(
    page.getByText('Updated account', { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByText('contact@example.com', { exact: true }),
  ).toBeVisible();
});
