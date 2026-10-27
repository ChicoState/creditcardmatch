import { expect, test } from '@playwright/test';

test('select, filter, compare, refresh and remove cards with keyboard controls', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/results');
  const citi = page.getByRole('button', {
    name: 'Add to compare: Citi Double Cash Card',
    exact: true,
  });
  await citi.focus();
  await page.keyboard.press('Space');
  await page
    .getByRole('button', {
      name: 'Add to compare: Chase Freedom Unlimited',
      exact: true,
    })
    .click();
  await page
    .getByRole('combobox', { name: 'Add a filter' })
    .selectOption('cashback');
  const cart = page.getByRole('region', { name: 'Comparison cart' });
  await expect(
    cart.getByText('Citi Double Cash Card', { exact: true }),
  ).toBeVisible();
  await expect(
    cart.getByText('Chase Freedom Unlimited', { exact: true }),
  ).toBeVisible();
  await cart.getByRole('link', { name: 'Compare cards (2/4)' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/compare');
  const table = page.getByRole('table', { name: 'Card comparison' });
  await expect(
    table.getByRole('columnheader', { name: /Citi Double Cash Card/ }),
  ).toBeVisible();
  await expect(
    table.getByRole('columnheader', { name: /Chase Freedom Unlimited/ }),
  ).toBeVisible();
  await expect(
    table
      .getByRole('row', { name: /^Other / })
      .getByText('2% cash back', { exact: true }),
  ).toBeVisible();
  await expect(
    table
      .getByRole('row', { name: /^Dining / })
      .getByText('3% cash back', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    table.getByRole('columnheader', { name: /Chase Freedom Unlimited/ }),
  ).toBeVisible();
  await table
    .getByRole('button', { name: 'Remove Citi Double Cash Card', exact: true })
    .click();
  await expect(
    page.getByText('Add another card to see the differences side by side.'),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Add more cards' }).click();
  await expect(
    page.getByRole('button', {
      name: 'Remove from comparison: Chase Freedom Unlimited',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Clear comparison' }).click();
  await cart.getByRole('link', { name: 'Compare cards (0/4)' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Start with a card that interests you.',
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('compared cards expose their issuer Apply links', async ({ page }) => {
  await page.goto('/results');
  const card = page
    .locator('article.result-card')
    .filter({
      has: page.locator('a.apply-link'),
    })
    .first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /^Add to compare:/ }).click();
  await page
    .getByRole('region', { name: 'Comparison cart' })
    .getByRole('link', { name: /Compare cards/ })
    .click();

  await expect(
    page
      .getByRole('table', { name: 'Card comparison' })
      .locator('a.apply-link'),
  ).toHaveCount(1);
});

test('limits selection to four and keeps selected controls available', async ({
  page,
}) => {
  await page.goto('/results');
  for (let i = 0; i < 4; i++)
    await page
      .getByRole('button', { name: /^Add to compare:/ })
      .first()
      .click();
  await expect(
    page.getByText('Your comparison is full. Remove a card to add another.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Add to compare:/ }).first(),
  ).toBeDisabled();
  await page
    .getByRole('button', { name: /^Remove from comparison:/ })
    .first()
    .click();
  await expect(
    page.getByRole('button', { name: /^Add to compare:/ }).first(),
  ).toBeEnabled();
});

for (const width of [320, 768, 1024, 1440]) {
  test(`comparison stays inside the page at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/results');
    for (let i = 0; i < 4; i++)
      await page
        .getByRole('button', { name: /^Add to compare:/ })
        .first()
        .click();
    await page
      .getByRole('region', { name: 'Comparison cart' })
      .getByRole('link', { name: 'Compare cards (4/4)' })
      .click();
    const region = page.getByRole('region', {
      name: 'Scrollable card comparison',
    });
    await expect(region).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (width < 1024) {
      expect(
        await region.evaluate(
          (element) => element.scrollWidth > element.clientWidth,
        ),
      ).toBe(true);
      await region.focus();
      await page.keyboard.press('End');
    }
    if (width === 1440 || width === 320)
      await page.screenshot({
        path: `/tmp/card-comparison-${width}.png`,
        fullPage: true,
      });
  });
}
