import { expect, test } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { encodeUsernameAsEmail } from '../../lib/auth/validation';

// Privileged fixtures are confined to the local stack. Never seed remote admins.
try {
  process.loadEnvFile('.env.local');
} catch {
  /* CI supplies environment variables. */
}
function localClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname))
    throw Error('Card request fixtures require local Supabase.');
  return {
    admin: createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false },
    }),
    client: () =>
      createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false },
      }),
  };
}
test('submission, private drafts, publication, linking and denial', async ({
  page,
}) => {
  test.setTimeout(120000);
  const { admin, client } = localClients();
  // Give this local fixture its own auth quota across repeated test runs.
  await page.setExtraHTTPHeaders({
    'x-forwarded-for': `2001:db8::${Date.now().toString(16).slice(-8, -4)}:${Date.now().toString(16).slice(-4)}`,
  });
  const suffix = Date.now().toString(36),
    username = `Request_${suffix}`,
    reviewer = `Review_${suffix}`,
    password = 'requesttest1';
  const userIds: string[] = [];
  let published: number | undefined;
  async function makeUser(name: string) {
    const { data, error } = await admin.auth.admin.createUser({
      email: encodeUsernameAsEmail(name),
      password,
      email_confirm: true,
      user_metadata: { username: name },
    });
    expect(error).toBeNull();
    userIds.push(data.user!.id);
    return data.user!;
  }
  const owner = await makeUser(username),
    staff = await makeUser(reviewer);
  await makeUser(`Other_${suffix}`);
  const filters = await admin
    .from('filters')
    .select('filter_id,label')
    .limit(1);
  expect(filters.error).toBeNull();
  const filter = filters.data![0];
  const initial = {
    card_name: `Request Test ${suffix}`,
    issuer: 'Test Bank',
    source_url: 'https://example.com/card',
    filter_ids: [filter.filter_id],
  };
  async function login(name: string) {
    await page.context().clearCookies();
    await page.goto('/login');
    await page.getByLabel('Username', { exact: true }).fill(name);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await expect(page).toHaveURL('/results');
  }
  try {
    expect(
      (await admin.from('app_admins').insert({ user_id: staff.id })).error,
    ).toBeNull();
    await page.goto('/card-requests/new');
    await expect(page).toHaveURL(/\/login\?next=/);
    await login(username);
    await page.goto('/card-requests/new');
    await page.getByLabel('Card name', { exact: true }).fill(initial.card_name);
    await page.getByLabel('Issuer', { exact: true }).fill(initial.issuer);
    await page
      .getByLabel('Official card URL', { exact: true })
      .fill(initial.source_url);
    await page.getByLabel(filter.label, { exact: true }).check();
    await page
      .getByRole('button', { name: 'Submit request', exact: true })
      .click();
    await expect(
      page.getByRole('heading', { name: 'Request submitted' }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'View your card requests' }).click();
    await expect(
      page.getByText(initial.card_name, { exact: true }),
    ).toBeVisible();
    const request = await admin
      .from('card_requests')
      .select('request_id')
      .eq('user_id', owner.id)
      .single();
    expect(request.error).toBeNull();
    const id = request.data!.request_id;
    const ownerClient = client(),
      otherClient = client();
    expect(
      (
        await ownerClient.auth.signInWithPassword({
          email: encodeUsernameAsEmail(username),
          password,
        })
      ).error,
    ).toBeNull();
    expect(
      (
        await otherClient.auth.signInWithPassword({
          email: encodeUsernameAsEmail(`Other_${suffix}`),
          password,
        })
      ).error,
    ).toBeNull();
    expect(
      (await otherClient.from('card_requests').select('*').eq('request_id', id))
        .data,
    ).toEqual([]);
    expect(
      (
        await ownerClient.from('card_requests').insert({
          user_id: owner.id,
          card_name: 'Forged',
          issuer: 'Bank',
          status: 'approved',
          reward_types: [],
        })
      ).error,
    ).not.toBeNull();
    expect(
      (
        await ownerClient.rpc('review_card_request', {
          p_actor: staff.id,
          p_request: id,
          p_revision: 0,
          p_action: 'deny',
          p_note: 'Forged',
        })
      ).error,
    ).not.toBeNull();
    await page.goto('/admin/card-requests');
    await expect(page).toHaveURL('/account/current-cards');
    await login(reviewer);
    await page.goto(`/admin/card-requests/${id}`);
    await page
      .getByLabel('Annual fee ($) (optional)', { exact: true })
      .fill('0');
    await page.getByLabel('Reward type', { exact: true }).selectOption('none');
    await page
      .getByLabel('Secured card', { exact: true })
      .selectOption('false');
    await page
      .getByLabel('Annual fee waived in first year', { exact: true })
      .selectOption('false');
    await page.getByRole('button', { name: 'Save draft', exact: true }).click();
    await expect
      .poll(async () => {
        const r = await admin
          .from('card_requests')
          .select('revision')
          .eq('request_id', id)
          .single();
        return r.data?.revision;
      })
      .toBe(1);
    expect(
      (
        await ownerClient
          .from('card_request_drafts')
          .select('*')
          .eq('request_id', id)
      ).data,
    ).toEqual([]);
    await page.reload();
    await expect(
      page.getByLabel('Annual fee ($) (optional)', { exact: true }),
    ).toHaveValue('0');
    for (const width of [320, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page
      .getByLabel(
        'I verified the final card facts and tags against the official source.',
      )
      .check();
    await page
      .getByRole('button', { name: 'Accept and publish', exact: true })
      .click();
    await expect(
      page.getByText('Status: Accepted', { exact: true }),
    ).toBeVisible();
    const accepted = await admin
      .from('card_requests')
      .select('catalog_card_id')
      .eq('request_id', id)
      .single();
    published = accepted.data!.catalog_card_id;
    expect(published).toBeTruthy();
    const card = await admin
      .from('credit_cards')
      .select('is_verified,is_active')
      .eq('card_id', published!)
      .single();
    expect(card.data).toEqual({ is_verified: true, is_active: true });
    const repeated = await admin.rpc('review_card_request', {
      p_actor: staff.id,
      p_request: id,
      p_revision: 1,
      p_action: 'publish',
      p_details: initial,
      p_verified: true,
    });
    expect(repeated.error?.code).toBe('40001');
    await page.goto('/results');
    await expect(page.locator(`#card-${published}`)).toContainText(
      initial.card_name,
    );
    const created = await admin
      .from('card_requests')
      .insert(
        [1, 2].map((n) => ({
          user_id: owner.id,
          card_name: `Followup ${n}`,
          issuer: 'Test Bank',
          reward_types: [],
          submission_details: initial,
        })),
      )
      .select('request_id');
    expect(created.error).toBeNull();
    const [link, deny] = created.data!;
    await page.goto(`/admin/card-requests/${link.request_id}`);
    await page
      .getByLabel('Existing verified card')
      .selectOption(String(published));
    await page
      .getByRole('button', { name: 'Accept with existing card' })
      .click();
    await expect(
      page.getByText('Status: Accepted', { exact: true }),
    ).toBeVisible();
    await page.goto(`/admin/card-requests/${deny.request_id}`);
    await page
      .getByLabel('Decision note (required for denial, visible to requester)')
      .fill('Unable to verify these details.');
    await page
      .getByRole('button', { name: 'Deny request', exact: true })
      .click();
    await expect(
      page.getByText('Status: Denied', { exact: true }),
    ).toBeVisible();
    await login(username);
    await page.goto('/account/card-requests');
    await expect(
      page.getByText('Unable to verify these details.', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'View accepted card in catalog' }),
    ).toHaveCount(2);
    // A missing related-row reference must roll back the entire publication.
    const rollback = await admin
      .from('card_requests')
      .insert({
        user_id: owner.id,
        card_name: 'Rollback test',
        issuer: 'Test Bank',
        reward_types: [],
      })
      .select('request_id')
      .single();
    expect(rollback.error).toBeNull();
    const invalid = await admin.rpc('review_card_request', {
      p_actor: staff.id,
      p_request: rollback.data!.request_id,
      p_revision: 0,
      p_action: 'publish',
      p_verified: true,
      p_details: {
        ...initial,
        card_name: `Rollback ${suffix}`,
        annual_fee: 0,
        is_secured: false,
        annual_fee_waived_first_year: false,
        reward_type: 'none',
        filter_ids: [-1],
        rewards: [],
        benefits: [],
      },
    });
    expect(invalid.error).not.toBeNull();
    expect(
      (
        await admin
          .from('credit_cards')
          .select('card_id')
          .eq('slug', `requested-card-${rollback.data!.request_id}`)
      ).data,
    ).toEqual([]);
    expect(
      (
        await admin
          .from('card_requests')
          .select('status')
          .eq('request_id', rollback.data!.request_id)
          .single()
      ).data?.status,
    ).toBe('pending');
    const concurrent = await Promise.all(
      [1, 2].map(() =>
        admin.rpc('review_card_request', {
          p_actor: staff.id,
          p_request: rollback.data!.request_id,
          p_revision: 0,
          p_action: 'save',
          p_details: initial,
        }),
      ),
    );
    expect(concurrent.filter((r) => !r.error)).toHaveLength(1);
    expect(concurrent.filter((r) => r.error?.code === '40001')).toHaveLength(1);
  } finally {
    // Delete only fixtures created by this test, respecting catalog references.
    await admin.from('card_requests').delete().eq('user_id', owner.id);
    if (published) {
      await admin.from('card_filters').delete().eq('card_id', published);
      await admin.from('card_rewards').delete().eq('card_id', published);
      await admin.from('card_benefits').delete().eq('card_id', published);
      await admin.from('credit_cards').delete().eq('card_id', published);
    }
    for (const id of userIds) await admin.auth.admin.deleteUser(id);
  }
});
