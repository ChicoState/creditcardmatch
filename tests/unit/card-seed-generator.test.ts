import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

// The generator is intentionally plain ESM so it can run directly in Node.
// @ts-expect-error The JavaScript module supplies JSDoc types at runtime.
import { generateSeed, parseCsv } from '../../scripts/generate-card-seed.mjs';

const execFileAsync = promisify(execFile);

const cardsHeader = [
  'card_slug',
  'issuer',
  'card_name',
  'network',
  'reward_type',
  'credit_level_required',
  'point_value_cents',
  'annual_fee',
  'annual_fee_waived_first_year',
  'one_time_fee',
  'monthly_fee',
  'foreign_transaction_fee_percent',
  'is_secured',
  'security_deposit_min',
  'intro_offer',
  'apply_url',
  'is_active',
  'image_url',
  'description',
  'source_url',
  'last_verified_at',
  'is_verified',
  'filter_popular_cards',
  'filter_cashback',
  'filter_no_credit_history',
  'entered_by',
  'notes',
].join(',');

async function writeCatalog(
  rootDir: string,
  overrides: { cards?: string; rewards?: string; benefits?: string } = {},
) {
  const catalogDir = path.join(rootDir, 'data', 'card-catalog');
  await mkdir(catalogDir, { recursive: true });
  await writeFile(
    path.join(catalogDir, 'cards.csv'),
    overrides.cards ??
      `${cardsHeader}\ncapital-one-platinum-secured,Example Bank,Example Secured,mastercard,,none,,0,N,,,0,Y,49,,https://example.com/apply,Y,,"An example, with a comma",https://example.com/source,2026-10-01,Y,Y,N,Y,Ignored Person,"Internal notes"\n`,
  );
  await writeFile(
    path.join(catalogDir, 'rewards.csv'),
    overrides.rewards ??
      'card_slug,category,reward_rate,spend_cap,cap_period,rate_after_cap,notes,source_url\ncapital-one-platinum-secured,other,0,,,,"No rewards",https://example.com/reward-source\n',
  );
  await writeFile(
    path.join(catalogDir, 'benefits.csv'),
    overrides.benefits ??
      'card_slug,sort_order,benefit\ncapital-one-platinum-secured,1,"A benefit with an apostrophe: cardholder\'s choice"\n',
  );
}

describe('parseCsv', () => {
  it('handles quoted commas, escaped quotes, and embedded newlines', () => {
    expect(
      parseCsv(
        'slug,description\r\ncard-one,"Line one, still one\nLine ""two"""\r\n',
      ),
    ).toEqual([
      ['slug', 'description'],
      ['card-one', 'Line one, still one\nLine "two"'],
    ]);
  });

  it('rejects malformed quoted fields with a source row', () => {
    expect(() => parseCsv('slug,name\na,"unterminated', 'cards.csv')).toThrow(
      'cards.csv row 2: unterminated quoted field',
    );
  });
});

describe('generateSeed', () => {
  it('maps validated CSV rows, applies the approved no-rewards override, and escapes strings', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'card-seed-'));
    await writeCatalog(rootDir);

    const result = await generateSeed(rootDir);

    expect(result.counts).toEqual({ cards: 1, rewards: 1, benefits: 1 });
    expect(result.sql).toContain('-- generated — do not edit');
    expect(result.sql).toContain("'none'");
    expect(result.sql).toContain("'An example, with a comma'");
    expect(result.sql).toContain(
      "'A benefit with an apostrophe: cardholder''s choice'",
    );
    expect(result.sql).toContain('reward.spend_cap::DECIMAL(10,2)');
    expect(result.sql).toContain('reward.rate_after_cap::DECIMAL(4,2)');
    expect(result.sql).toContain("'no-credit-history'");
    expect(result.sql).not.toContain('entered_by');
    expect(result.sql).not.toContain('Ignored Person');
    expect(result.sql).not.toContain('Internal notes');
    expect(result.sql).not.toContain('https://example.com/reward-source');
  });

  it('lists the file and row for every validation error', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'card-seed-'));
    await writeCatalog(rootDir, {
      cards: `${cardsHeader}\nduplicate,Example Bank,First Card,bad-network,cashback,good,,,-maybe,,,,N,,,,Y,,,,,Y,N,N,N,,\nduplicate,Example Bank,Second Card,visa,cashback,good,,0,N,,,,N,,,,Y,,,,,Y,N,N,N,,\n`,
      rewards:
        'card_slug,category,reward_rate,spend_cap,cap_period,rate_after_cap,notes,source_url\nmissing-card,other,1,100,,,,https://example.com/ignored\n',
    });

    await expect(generateSeed(rootDir)).rejects.toThrowError(
      expect.objectContaining({
        message: expect.stringContaining(
          'data/card-catalog/cards.csv row 2: network must be one of visa, mastercard, amex, discover',
        ),
      }),
    );

    try {
      await generateSeed(rootDir);
    } catch (error) {
      const message = String(error);
      expect(message).toContain(
        'data/card-catalog/cards.csv row 2: annual_fee is required',
      );
      expect(message).toContain(
        'data/card-catalog/cards.csv row 2: annual_fee_waived_first_year must be Y or N',
      );
      expect(message).toContain(
        'data/card-catalog/cards.csv row 3: duplicate card slug "duplicate"',
      );
      expect(message).toContain(
        'data/card-catalog/rewards.csv row 2: unknown card slug "missing-card"',
      );
      expect(message).toContain(
        'data/card-catalog/rewards.csv row 2: spend_cap and cap_period must both be blank or both be set',
      );
      expect(message).toContain(
        'data/card-catalog/cards.csv row 2: card "duplicate" has no other reward row',
      );
    }
  });

  it('derives no-annual-fee membership only from a zero annual fee', async () => {
    const rootDir = await mkdtemp(path.join(tmpdir(), 'card-seed-'));
    const cardRow = (
      slug: string,
      annualFee: string,
      annualFeeWaivedFirstYear: 'Y' | 'N',
    ) =>
      [
        slug,
        'Example Bank',
        slug,
        'visa',
        'cashback',
        'good',
        '1',
        annualFee,
        annualFeeWaivedFirstYear,
        '',
        '',
        '0',
        'N',
        '',
        '',
        'https://example.com/apply',
        'Y',
        '',
        '',
        'https://example.com/source',
        '2026-10-01',
        'Y',
        'N',
        'N',
        'N',
        '',
        '',
      ].join(',');

    await writeCatalog(rootDir, {
      cards: `${cardsHeader}\n${cardRow('free-card', '0', 'N')}\n${cardRow('paid-card', '95', 'N')}\n${cardRow('first-year-waived-card', '95', 'Y')}\n`,
      rewards:
        'card_slug,category,reward_rate,spend_cap,cap_period,rate_after_cap,notes,source_url\nfree-card,other,1,,,,,\npaid-card,other,1,,,,,\nfirst-year-waived-card,other,1,,,,,\n',
      benefits: 'card_slug,sort_order,benefit\n',
    });

    const result = await generateSeed(rootDir);

    expect(result.sql).toContain("('free-card', 'no-annual-fee')");
    expect(result.sql).not.toContain("('paid-card', 'no-annual-fee')");
    expect(result.sql).not.toContain(
      "('first-year-waived-card', 'no-annual-fee')",
    );
  });
});

describe('generated seed', () => {
  it('is up to date with the team CSV exports', async () => {
    await expect(
      execFileAsync(
        process.execPath,
        ['scripts/generate-card-seed.mjs', '--check'],
        {
          cwd: process.cwd(),
        },
      ),
    ).resolves.toMatchObject({ stdout: expect.stringContaining('up to date') });

    const seed = await readFile('supabase/seed.sql', 'utf8');
    expect(seed).toMatch(/^-- generated — do not edit/u);
  });
});
