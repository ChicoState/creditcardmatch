import { expect, test } from '@playwright/test';

test.describe.serial('username authentication', () => {
  const username = `E2E_${Date.now().toString(36)}`;
  const password = 'matchtest1';

  test('signup, session header, logout, and login', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(
      page.getByText('At least 8 characters and one digit.'),
    ).toBeVisible();

    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText(username, { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

    await page.getByRole('link', { name: 'Login' }).click();
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page).toHaveURL('/');
    await expect(page.getByText(username, { exact: true })).toBeVisible();
  });

  test('wrong credentials show a generic error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill('wrongpass1');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Invalid username or password.',
    );
  });
});
