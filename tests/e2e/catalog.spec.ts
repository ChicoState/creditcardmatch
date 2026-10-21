import { expect, type Locator, test } from '@playwright/test';

async function expectEveryCardToExplain(
  cards: Locator,
  expectedExplanation: string,
) {
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(cards.nth(index)).toContainText(expectedExplanation);
  }
}

async function completeSurvey(
  page: import('@playwright/test').Page,
  {
    annualFee = 'Yes',
    creditScore = 'Good (670–739)',
    primaryGoal = 'Cash back',
  }: {
    annualFee?: 'Yes' | 'No';
    creditScore?: string;
    primaryGoal?: string;
  } = {},
) {
  await page.getByLabel('$60,001–$80,000').check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel(creditScore).check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel(primaryGoal).check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Groceries').check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel('Groceries').fill('425');
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByLabel(annualFee, { exact: true }).check();
  await page.getByRole('button', { name: 'Next question' }).click();
  await page.getByRole('button', { name: 'Review answers' }).click();
}

test('issue #2: a visitor can browse a non-empty active catalog', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'START FRESH' }).click();

  await expect(
    page.getByRole('heading', { name: 'Our Recommendations' }),
  ).toBeVisible();
  await expect(page.locator('article.result-card').first()).toBeVisible();
  await expect(page.getByText(/^[1-9]\d* matches?$/)).toBeVisible();
});

test('issue #3: every shown card matches the active filter', async ({
  page,
}) => {
  await page.goto('/results?filters=popular-cards');

  const activeFilters = page.getByLabel('Active filters');
  await expect(activeFilters.getByText('Popular Cards')).toBeVisible();
  await expectEveryCardToExplain(
    page.locator('article.result-card'),
    'Matches every active filter: Popular Cards.',
  );
});

test('a visitor can open the credit card FAQ from the home and results pages', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Credit card FAQ' })
    .click();

  await expect(
    page.getByRole('heading', { name: 'Credit card basics' }),
  ).toBeVisible();

  await page.goto('/results');
  await page.getByRole('link', { name: 'Learn credit card basics' }).click();

  await expect(
    page.getByRole('heading', { name: 'Credit card basics' }),
  ).toBeVisible();
});

test('a visitor can open the legal page without a gate', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Legal' }).first().click();

  await expect(
    page.getByRole('heading', { name: 'Before you use a credit card' }),
  ).toBeVisible();
  await expect(page.getByText(/no acknowledgment/i)).not.toBeVisible();

  await page.goto('/results');
  await page.getByRole('link', { name: /read the legal page/i }).click();
  await expect(
    page.getByRole('heading', { name: 'When debt becomes a legal problem' }),
  ).toBeVisible();
});

test('issue #3: a cash-back survey path returns a focused shortlist', async ({
  page,
}) => {
  await page.goto('/survey');
  await completeSurvey(page);
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(page).toHaveURL(/\/results\?mode=survey&filters=cashback$/);
  const activeFilters = page.getByLabel('Active filters');
  await expect(activeFilters.getByText('Cashback')).toBeVisible();
  await expectEveryCardToExplain(
    page.locator('article.result-card'),
    'Cashback: category match',
  );
});

test('issue #9: result chips match filters derived from the survey', async ({
  page,
}) => {
  await page.goto('/survey');
  await completeSurvey(page, {
    creditScore: 'Building/no score yet',
    primaryGoal: 'Cash back',
  });
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(page).toHaveURL(
    /\/results\?mode=survey&filters=new-to-credit,cashback$/,
  );
  const activeFilters = page.getByLabel('Active filters');
  await expect(activeFilters.getByText('New-to-Credit')).toBeVisible();
  await expect(activeFilters.getByText('Cashback')).toBeVisible();
  await expectEveryCardToExplain(
    page.locator('article.result-card'),
    'Cashback: category match',
  );
});

test('issue #14: adding New-to-Credit narrows the cashback list', async ({
  page,
}) => {
  await page.goto('/results?filters=cashback');
  const cards = page.locator('article.result-card');
  const cashbackCount = await cards.count();
  expect(cashbackCount).toBeGreaterThan(0);

  await page
    .getByRole('combobox', { name: 'Add a filter' })
    .selectOption('new-to-credit');

  await expect(page).toHaveURL(/\/results\?filters=cashback,new-to-credit$/);
  await expect.poll(() => cards.count()).toBeLessThan(cashbackCount);
  await expectEveryCardToExplain(
    cards,
    'Matches every active filter: Cashback, New-to-Credit.',
  );
});

test('adding No Annual Fee shows only cards with a $0 annual fee', async ({
  page,
}) => {
  await page.goto('/results');
  await page
    .getByRole('combobox', { name: 'Add a filter' })
    .selectOption('no-annual-fee');

  await expect(page).toHaveURL(/\/results\?filters=no-annual-fee$/);
  await expect(
    page.getByLabel('Active filters').getByText('No Annual Fee'),
  ).toBeVisible();

  const cards = page.locator('article.result-card');
  const count = await cards.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const annualFee = cards
      .nth(index)
      .locator('.card-details > div')
      .filter({ hasText: 'Annual fee' })
      .locator('dd');
    await expect(annualFee).toHaveText('$0');
  }
});

test('declining annual fees in the survey shows the No Annual Fee chip', async ({
  page,
}) => {
  await page.goto('/survey');
  await completeSurvey(page, {
    annualFee: 'No',
    primaryGoal: 'Travel rewards',
  });
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(
    page.getByLabel('Active filters').getByText('No Annual Fee'),
  ).toBeVisible();
});
