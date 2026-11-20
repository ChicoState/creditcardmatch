import { expect, test } from '@playwright/test';

test('pages send basic browser protections', async ({ request }) => {
  for (const path of ['/', '/login', '/legal']) {
    const response = await request.get(path);
    expect(response.ok()).toBe(true);
    expect(response.headers()['content-security-policy']).toBe(
      "frame-ancestors 'none'",
    );
    expect(response.headers()['x-frame-options']).toBe('DENY');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['referrer-policy']).toBe(
      'strict-origin-when-cross-origin',
    );
  }
});

test('the browser blocks embedding even from the same site', async ({
  page,
}) => {
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: 'Login', exact: true }),
  ).toBeVisible();

  const blocked = page.waitForEvent('console', {
    predicate: (message) =>
      message.type() === 'error' &&
      /frame-ancestors|X-Frame-Options/i.test(message.text()),
  });
  await page.evaluate(() => {
    const frame = document.createElement('iframe');
    frame.title = 'Blocked embedded login';
    frame.src = '/login';
    document.body.append(frame);
  });
  await blocked;
  await expect(
    page
      .frameLocator('iframe[title="Blocked embedded login"]')
      .getByRole('button', { name: 'Login', exact: true }),
  ).toHaveCount(0);
});
