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

test('issue #9: result chips match filters derived from the survey', async ({
  page,
}) => {
  await page.goto('/survey');
  await page.getByLabel('Income range B (TBD)').check();
  await page.getByLabel('No credit history').check();
  await page.getByLabel('Cashback', { exact: true }).check();
  await page.getByRole('button', { name: 'SEE MY MATCHES' }).click();

  await expect(page).toHaveURL(/\/results\?filters=new-to-credit,cashback$/);
  const activeFilters = page.getByLabel('Active filters');
  await expect(activeFilters.getByText('New-to-Credit')).toBeVisible();
  await expect(activeFilters.getByText('Cashback')).toBeVisible();
  await expectEveryCardToExplain(
    page.locator('article.result-card'),
    'Matches every active filter: New-to-Credit, Cashback.',
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
