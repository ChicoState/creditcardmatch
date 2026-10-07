import { expect, test } from '@playwright/test';

test('issue #2: a visitor can browse the active fictional catalog', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'START FRESH' }).click();

  await expect(
    page.getByRole('heading', { name: 'Our Recommendations' }),
  ).toBeVisible();
  await expect(page.getByText('4 matches')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aurora Cash Card' }),
  ).toBeVisible();
  await expect(page.getByText('Archived Sample Card')).toHaveCount(0);
});

test('issue #3: a high-spend survey path returns a focused shortlist', async ({
  page,
}) => {
  await page.goto('/survey');
  await page.getByLabel('Income range C (TBD)').check();
  await page.getByLabel('Credit range B (TBD)').check();
  await page.getByLabel('Groceries (TBD)').fill('2500');
  await page.getByLabel('Dining (TBD)').fill('1200');
  await page.getByLabel('Popular Cards', { exact: true }).check();
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(page).toHaveURL(/\/results\?filters=popular-cards$/);
  await expect(page.getByText('3 matches')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Summit Flex Card' }),
  ).toBeVisible();
});

test('issue #9: survey answers drive personalized card filtering', async ({
  page,
}) => {
  await page.goto('/survey');
  await page.getByLabel('Income range B (TBD)').check();
  await page.getByLabel('No credit history (TBD value)').check();
  await page.getByLabel('Cashback', { exact: true }).check();
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(page).toHaveURL(/\/results\?filters=new-to-credit,cashback$/);
  await expect(page.getByText('1 match')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Meadow Cash Starter' }),
  ).toBeVisible();
  await expect(
    page.getByText('Matches every active filter: New-to-Credit, Cashback.'),
  ).toBeVisible();
});

test('issue #14: a visitor can compare new-to-credit cards', async ({
  page,
}) => {
  await page.goto('/results');
  await page
    .getByRole('combobox', { name: 'Add a filter' })
    .selectOption('new-to-credit');

  await expect(page).toHaveURL(/\/results\?filters=new-to-credit$/);
  await expect(page.getByText('2 matches')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Harbor Starter Card' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Meadow Cash Starter' }),
  ).toBeVisible();
  await expect(page.getByText('Unverified')).toBeVisible();
});
