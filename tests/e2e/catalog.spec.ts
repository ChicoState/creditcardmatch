import { expect, test } from '@playwright/test';

async function completeSurvey(
  page: import('@playwright/test').Page,
  {
    creditScore = 'Good (670–739)',
    primaryGoal = 'Cash back',
  }: { creditScore?: string; primaryGoal?: string } = {},
) {
  await page.getByLabel('$60,001–$80,000').check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel(creditScore).check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel(primaryGoal).check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Groceries').check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('No').check();
  await page.getByRole('button', { name: 'Review answers' }).click();
}

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

test('issue #3: a cash-back survey path returns a focused shortlist', async ({
  page,
}) => {
  await page.goto('/survey');
  await completeSurvey(page);
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(page).toHaveURL(/\/results\?filters=cashback$/);
  await expect(page.getByText('2 matches')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Aurora Cash Card' }),
  ).toBeVisible();
});

test('issue #9: survey answers drive personalized card filtering', async ({
  page,
}) => {
  await page.goto('/survey');
  await completeSurvey(page, {
    creditScore: 'Building/no score yet',
    primaryGoal: 'Cash back',
  });
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
