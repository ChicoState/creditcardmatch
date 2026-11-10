import { expect, test } from '@playwright/test';

test('a signed-in user can save, reuse, and revisit survey recommendations', async ({
  page,
}) => {
  const username = `SavedSurvey_${Date.now().toString(36)}`;

  await page.goto('/signup');
  await page.getByLabel('Username', { exact: true }).fill(username);
  await page.getByLabel('Password', { exact: true }).fill('savedtest1');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/survey');
  await page.getByLabel('$40,001–$60,000').click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Building/no score yet').click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Cash back').click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Groceries').click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Groceries').fill('250');
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('No').click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('None in particular').click();
  await page.getByRole('button', { name: 'Review answers' }).click();

  await page.getByRole('button', { name: 'SAVE ANSWERS' }).click();
  await expect(page).toHaveURL(/\/results\?.*saved=1/);
  await expect(
    page.getByText('Your survey answers have been saved.'),
  ).toBeVisible();

  await page.goto('/account');
  await expect(
    page.getByRole('heading', { name: 'Saved survey' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Update saved answers' }).click();
  await expect(page).toHaveURL('/survey?review=1');
  await expect(
    page.getByRole('heading', { name: 'Review your answers' }),
  ).toBeVisible();

  await page.goto('/account');
  await page.getByRole('link', { name: 'View my recommended cards' }).click();
  await expect(page).toHaveURL('/results?mode=saved');
  await expect(
    page.getByRole('heading', {
      name: 'Cards ranked by how well they fit your answers',
    }),
  ).toBeVisible();

  await page.goto('/survey');
  await expect(
    page.getByRole('heading', { name: 'Use your saved answers?' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'USE SAVED ANSWERS' }).click();
  await expect(
    page.getByRole('heading', { name: 'Review your answers' }),
  ).toBeVisible();
});
