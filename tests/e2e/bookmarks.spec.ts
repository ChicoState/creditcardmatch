import { expect, test } from '@playwright/test';

test.describe('bookmarked cards', () => {
  const username = `Bookmark_${Date.now().toString(36)}`;
  const password = 'bookmarktest1';

  test('signed-out visitors are sent to login from the bookmarks page', async ({
    page,
  }) => {
    await page.goto('/bookmarks');

    await expect(page).toHaveURL(/\/login\?next=%2Fbookmarks$/);
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  });

  test('a signed-in user can save and remove a card', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel('Username').fill(username);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page.getByText(username, { exact: true })).toBeVisible();

    await page.goto('/results');
    const firstCard = page.locator('article.result-card').first();
    const cardName = await firstCard
      .getByRole('heading', { level: 2 })
      .innerText();
    const bookmark = firstCard.getByRole('button', {
      name: `Bookmark ${cardName}`,
    });
    await bookmark.click();
    await expect(bookmark).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/bookmarks');
    await expect(
      page.getByRole('heading', { name: 'Bookmarked cards' }),
    ).toBeVisible();
    const savedCard = page
      .locator('article.result-card')
      .filter({ hasText: cardName });
    await expect(savedCard).toBeVisible();

    await savedCard
      .getByRole('button', {
        name: `Remove ${cardName} from bookmarks`,
      })
      .click();
    await expect(page.getByText('No saved cards yet')).toBeVisible();
  });
});
