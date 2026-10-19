import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const CARD_FILE = 'data/card-catalog/cards.csv';
const REWARD_FILE = 'data/card-catalog/rewards.csv';
const BENEFIT_FILE = 'data/card-catalog/benefits.csv';
const SEED_FILE = 'supabase/seed.sql';

const NETWORKS = ['visa', 'mastercard', 'amex', 'discover'];
const REWARD_TYPES = ['cashback', 'points', 'miles', 'none'];
const CREDIT_LEVELS = ['none', 'fair', 'good', 'excellent'];
const CAP_PERIODS = ['month', 'quarter', 'year'];
const CATEGORIES = [
  'groceries',
  'dining',
  'gas',
  'travel',
  'streaming',
  'online_shopping',
  'other',
];
const FILTER_COLUMNS = new Map([
  ['filter_popular_cards', 'popular-cards'],
  ['filter_cashback', 'cashback'],
  ['filter_new_to_credit', 'new-to-credit'],
]);

const CARD_COLUMNS = [
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
  ...FILTER_COLUMNS.keys(),
];
const REWARD_COLUMNS = [
  'card_slug',
  'category',
  'reward_rate',
  'spend_cap',
  'cap_period',
  'rate_after_cap',
  'notes',
];
const BENEFIT_COLUMNS = ['card_slug', 'sort_order', 'benefit'];

/**
 * Parse RFC 4180-style CSV, including escaped quotes and newlines in quoted
 * fields. Empty trailing records are ignored.
 *
 * @param {string} source
 * @param {string} [sourceName]
 * @returns {string[][]}
 */
export function parseCsv(source, sourceName = 'CSV') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let closedQuote = false;

  const finishField = () => {
    row.push(field);
    field = '';
    closedQuote = false;
  };
  const finishRow = () => {
    finishField();
    if (row.some((value) => value.length > 0)) rows.push(row);
    row = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (inQuotes) {
      if (character === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
          closedQuote = true;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (
      closedQuote &&
      character !== ',' &&
      character !== '\r' &&
      character !== '\n'
    ) {
      throw new Error(
        `${sourceName} row ${rows.length + 1}: unexpected character after closing quote`,
      );
    }
    if (character === '"') {
      if (field.length > 0) {
        throw new Error(
          `${sourceName} row ${rows.length + 1}: unexpected quote in unquoted field`,
        );
      }
      inQuotes = true;
    } else if (character === ',') {
      finishField();
    } else if (character === '\n') {
      finishRow();
    } else if (character === '\r') {
      if (source[index + 1] === '\n') index += 1;
      finishRow();
    } else {
      field += character;
    }
  }

  if (inQuotes) {
    throw new Error(
      `${sourceName} row ${rows.length + 1}: unterminated quoted field`,
    );
  }
  if (field.length > 0 || row.length > 0 || source.endsWith(',')) finishRow();

  return rows;
}

function isBlank(value) {
  return value.trim().length === 0;
}

function structuredValue(value) {
  return value.trim();
}

function nullableText(value) {
  return isBlank(value) ? null : value;
}

function sqlString(value) {
  if (value.includes('\0'))
    throw new Error('SQL strings cannot contain NUL bytes');
  return `'${value.replaceAll("'", "''")}'`;
}

function sqlNullableString(value) {
  return value === null ? 'NULL' : sqlString(value);
}

function sqlBoolean(value) {
  return value ? 'TRUE' : 'FALSE';
}

function location(file, row) {
  return `${file} row ${row}`;
}

function requireValue(record, column, file, errors) {
  const value = structuredValue(record.data[column] ?? '');
  if (!value)
    errors.push(`${location(file, record.row)}: ${column} is required`);
  return value;
}

function validateList(
  value,
  column,
  allowed,
  file,
  row,
  errors,
  nullable = true,
) {
  if (!value && nullable) return;
  if (!allowed.includes(value)) {
    errors.push(
      `${location(file, row)}: ${column} must be one of ${allowed.join(', ')}`,
    );
  }
}

function parseBoolean(record, column, file, errors, required = true) {
  const value = structuredValue(record.data[column] ?? '');
  if (!value && !required) return null;
  if (value !== 'Y' && value !== 'N') {
    errors.push(`${location(file, record.row)}: ${column} must be Y or N`);
    return false;
  }
  return value === 'Y';
}

function parseDecimal(
  record,
  column,
  file,
  errors,
  { required = false, minimum = null, exclusiveMinimum = false } = {},
) {
  const value = structuredValue(record.data[column] ?? '');
  if (!value) {
    if (required)
      errors.push(`${location(file, record.row)}: ${column} is required`);
    return null;
  }
  if (
    !/^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ||
    !Number.isFinite(Number(value))
  ) {
    errors.push(
      `${location(file, record.row)}: ${column} must be a decimal number`,
    );
    return null;
  }
  if (
    minimum !== null &&
    (exclusiveMinimum ? Number(value) <= minimum : Number(value) < minimum)
  ) {
    errors.push(
      `${location(file, record.row)}: ${column} must be ${exclusiveMinimum ? 'greater than' : 'at least'} ${minimum}`,
    );
  }
  return value;
}

function parseInteger(record, column, file, errors) {
  const value = requireValue(record, column, file, errors);
  if (value && !/^-?\d+$/.test(value)) {
    errors.push(`${location(file, record.row)}: ${column} must be an integer`);
    return '0';
  }
  return value || '0';
}

async function readRecords(rootDir, file, requiredColumns) {
  let source;
  try {
    source = await readFile(path.join(rootDir, file), 'utf8');
  } catch (error) {
    throw new Error(`${file}: unable to read CSV`, { cause: error });
  }

  const rows = parseCsv(source.replace(/^\uFEFF/u, ''), file);
  if (rows.length === 0)
    throw new Error(`${file} row 1: header row is required`);

  const headers = rows[0].map((header) => header.trim());
  const duplicateHeaders = headers.filter(
    (header, index) => headers.indexOf(header) !== index,
  );
  if (duplicateHeaders.length > 0) {
    throw new Error(
      `${file} row 1: duplicate columns: ${[...new Set(duplicateHeaders)].join(', ')}`,
    );
  }

  const missingHeaders = requiredColumns.filter(
    (column) => !headers.includes(column),
  );
  if (missingHeaders.length > 0) {
    throw new Error(
      `${file} row 1: missing columns: ${missingHeaders.join(', ')}`,
    );
  }

  return rows.slice(1).map((values, index) => ({
    row: index + 2,
    data: Object.fromEntries(
      headers.map((header, column) => [header, values[column] ?? '']),
    ),
  }));
}

function renderValues(rows) {
  return rows.map((row) => `    (${row.join(', ')})`).join(',\n');
}

function renderSeed(cards, rewards, benefits, cardFilters) {
  const cardRows = cards.map((card) => [
    sqlString(card.slug),
    sqlString(card.issuer),
    sqlString(card.cardName),
    sqlNullableString(card.network),
    sqlNullableString(card.rewardType),
    sqlNullableString(card.creditLevelRequired),
    card.pointValueCents ?? 'NULL',
    card.annualFee,
    sqlBoolean(card.annualFeeWaivedFirstYear),
    card.oneTimeFee ?? 'NULL',
    card.monthlyFee ?? 'NULL',
    card.foreignTransactionFeePercent ?? 'NULL',
    sqlBoolean(card.isSecured),
    card.securityDepositMin ?? 'NULL',
    sqlNullableString(card.introOffer),
    sqlNullableString(card.applyUrl),
    sqlBoolean(card.isActive),
    sqlNullableString(card.imageUrl),
    sqlNullableString(card.description),
    sqlNullableString(card.sourceUrl),
    sqlNullableString(card.lastVerifiedAt),
    sqlBoolean(card.isVerified),
  ]);
  const rewardRows = rewards.map((reward) => [
    sqlString(reward.cardSlug),
    sqlString(reward.category),
    reward.rewardRate,
    reward.spendCap ?? 'NULL',
    sqlNullableString(reward.capPeriod),
    reward.rateAfterCap ?? 'NULL',
    sqlNullableString(reward.notes),
  ]);
  const benefitRows = benefits.map((benefit) => [
    sqlString(benefit.cardSlug),
    sqlString(benefit.description),
    benefit.sortOrder,
  ]);
  const filterRows = cardFilters.map(({ cardSlug, filterSlug }) => [
    sqlString(cardSlug),
    sqlString(filterSlug),
  ]);

  const sections = [
    '-- generated — do not edit',
    '-- Source: data/card-catalog/{cards,rewards,benefits}.csv',
    `-- Imported: ${cards.length} cards, ${rewards.length} reward rows, ${benefits.length} benefits`,
    '',
    'BEGIN;',
    '',
    `INSERT INTO public.credit_cards (\n    slug, issuer, card_name, network, reward_type, credit_level_required,\n    point_value_cents, annual_fee, annual_fee_waived_first_year, one_time_fee,\n    monthly_fee, foreign_transaction_fee_percent, is_secured, security_deposit_min,\n    intro_offer, apply_url, is_active, image_url, description, source_url,\n    last_verified_at, is_verified\n)\nVALUES\n${renderValues(cardRows)};`,
  ];

  if (rewardRows.length > 0) {
    sections.push(
      '',
      `INSERT INTO public.card_rewards (\n    card_id, category_id, reward_rate, spend_cap, cap_period, rate_after_cap, notes\n)\nSELECT card.card_id, category.category_id, reward.reward_rate,\n       reward.spend_cap::DECIMAL(10,2), reward.cap_period,\n       reward.rate_after_cap::DECIMAL(4,2), reward.notes\nFROM (\n    VALUES\n${renderValues(rewardRows)}\n) AS reward(card_slug, category_slug, reward_rate, spend_cap, cap_period, rate_after_cap, notes)\nJOIN public.credit_cards AS card ON card.slug = reward.card_slug\nJOIN public.reward_categories AS category ON category.slug = reward.category_slug;`,
    );
  }

  if (filterRows.length > 0) {
    sections.push(
      '',
      `INSERT INTO public.card_filters (card_id, filter_id)\nSELECT card.card_id, filter.filter_id\nFROM (\n    VALUES\n${renderValues(filterRows)}\n) AS assignment(card_slug, filter_slug)\nJOIN public.credit_cards AS card ON card.slug = assignment.card_slug\nJOIN public.filters AS filter ON filter.slug = assignment.filter_slug;`,
    );
  }

  if (benefitRows.length > 0) {
    sections.push(
      '',
      `INSERT INTO public.card_benefits (card_id, description, sort_order)\nSELECT card.card_id, benefit.description, benefit.sort_order\nFROM (\n    VALUES\n${renderValues(benefitRows)}\n) AS benefit(card_slug, description, sort_order)\nJOIN public.credit_cards AS card ON card.slug = benefit.card_slug;`,
    );
  }

  sections.push('', 'COMMIT;', '');
  return sections.join('\n');
}

/**
 * Validate the three catalog exports and return deterministic seed SQL.
 *
 * @param {string} rootDir
 */
export async function generateSeed(rootDir) {
  const [cardRecords, rewardRecords, benefitRecords] = await Promise.all([
    readRecords(rootDir, CARD_FILE, CARD_COLUMNS),
    readRecords(rootDir, REWARD_FILE, REWARD_COLUMNS),
    readRecords(rootDir, BENEFIT_FILE, BENEFIT_COLUMNS),
  ]);
  const errors = [];
  const knownSlugs = new Set();
  const cardRowBySlug = new Map();

  const cards = cardRecords.map((record) => {
    const slug = requireValue(record, 'card_slug', CARD_FILE, errors);
    if (knownSlugs.has(slug)) {
      errors.push(
        `${location(CARD_FILE, record.row)}: duplicate card slug "${slug}"`,
      );
    } else if (slug) {
      knownSlugs.add(slug);
      cardRowBySlug.set(slug, record.row);
    }

    const network = structuredValue(record.data.network);
    const sourceRewardType = structuredValue(record.data.reward_type);
    const creditLevelRequired = structuredValue(
      record.data.credit_level_required,
    );
    validateList(network, 'network', NETWORKS, CARD_FILE, record.row, errors);
    validateList(
      sourceRewardType,
      'reward_type',
      REWARD_TYPES,
      CARD_FILE,
      record.row,
      errors,
    );
    validateList(
      creditLevelRequired,
      'credit_level_required',
      CREDIT_LEVELS,
      CARD_FILE,
      record.row,
      errors,
    );

    for (const column of FILTER_COLUMNS.keys()) {
      parseBoolean(record, column, CARD_FILE, errors);
    }

    return {
      slug,
      issuer: requireValue(record, 'issuer', CARD_FILE, errors),
      cardName: requireValue(record, 'card_name', CARD_FILE, errors),
      network: network || null,
      rewardType:
        slug === 'capital-one-platinum-secured'
          ? 'none'
          : sourceRewardType || null,
      creditLevelRequired: creditLevelRequired || null,
      pointValueCents: parseDecimal(
        record,
        'point_value_cents',
        CARD_FILE,
        errors,
        { minimum: 0, exclusiveMinimum: true },
      ),
      annualFee: parseDecimal(record, 'annual_fee', CARD_FILE, errors, {
        required: true,
        minimum: 0,
      }),
      annualFeeWaivedFirstYear: parseBoolean(
        record,
        'annual_fee_waived_first_year',
        CARD_FILE,
        errors,
      ),
      oneTimeFee: parseDecimal(record, 'one_time_fee', CARD_FILE, errors, {
        minimum: 0,
      }),
      monthlyFee: parseDecimal(record, 'monthly_fee', CARD_FILE, errors, {
        minimum: 0,
      }),
      foreignTransactionFeePercent: parseDecimal(
        record,
        'foreign_transaction_fee_percent',
        CARD_FILE,
        errors,
        { minimum: 0 },
      ),
      isSecured: parseBoolean(record, 'is_secured', CARD_FILE, errors),
      securityDepositMin: parseDecimal(
        record,
        'security_deposit_min',
        CARD_FILE,
        errors,
        { minimum: 0 },
      ),
      introOffer: nullableText(record.data.intro_offer),
      applyUrl: nullableText(record.data.apply_url),
      isActive: parseBoolean(record, 'is_active', CARD_FILE, errors),
      imageUrl: nullableText(record.data.image_url),
      description: nullableText(record.data.description),
      sourceUrl: nullableText(record.data.source_url),
      lastVerifiedAt: nullableText(record.data.last_verified_at),
      isVerified: parseBoolean(record, 'is_verified', CARD_FILE, errors),
    };
  });

  const rewardKeys = new Set();
  const cardsWithOtherReward = new Set();
  const rewards = rewardRecords.map((record) => {
    const cardSlug = requireValue(record, 'card_slug', REWARD_FILE, errors);
    const category = requireValue(record, 'category', REWARD_FILE, errors);
    if (cardSlug && !knownSlugs.has(cardSlug)) {
      errors.push(
        `${location(REWARD_FILE, record.row)}: unknown card slug "${cardSlug}"`,
      );
    }
    validateList(
      category,
      'category',
      CATEGORIES,
      REWARD_FILE,
      record.row,
      errors,
      false,
    );
    const rewardKey = `${cardSlug}\0${category}`;
    if (rewardKeys.has(rewardKey)) {
      errors.push(
        `${location(REWARD_FILE, record.row)}: duplicate reward category "${category}" for card "${cardSlug}"`,
      );
    }
    rewardKeys.add(rewardKey);
    if (category === 'other') cardsWithOtherReward.add(cardSlug);

    const spendCap = parseDecimal(record, 'spend_cap', REWARD_FILE, errors, {
      minimum: 0,
      exclusiveMinimum: true,
    });
    const capPeriod = structuredValue(record.data.cap_period);
    if ((spendCap === null) !== !capPeriod) {
      errors.push(
        `${location(REWARD_FILE, record.row)}: spend_cap and cap_period must both be blank or both be set`,
      );
    }
    validateList(
      capPeriod,
      'cap_period',
      CAP_PERIODS,
      REWARD_FILE,
      record.row,
      errors,
    );

    return {
      cardSlug,
      category,
      rewardRate: parseDecimal(record, 'reward_rate', REWARD_FILE, errors, {
        required: true,
        minimum: 0,
      }),
      spendCap,
      capPeriod: capPeriod || null,
      rateAfterCap: parseDecimal(
        record,
        'rate_after_cap',
        REWARD_FILE,
        errors,
        { minimum: 0 },
      ),
      notes: nullableText(record.data.notes),
    };
  });

  for (const slug of knownSlugs) {
    if (!cardsWithOtherReward.has(slug)) {
      errors.push(
        `${location(CARD_FILE, cardRowBySlug.get(slug))}: card "${slug}" has no other reward row`,
      );
    }
  }

  const benefits = benefitRecords.map((record) => {
    const cardSlug = requireValue(record, 'card_slug', BENEFIT_FILE, errors);
    if (cardSlug && !knownSlugs.has(cardSlug)) {
      errors.push(
        `${location(BENEFIT_FILE, record.row)}: unknown card slug "${cardSlug}"`,
      );
    }
    return {
      cardSlug,
      description: requireValue(record, 'benefit', BENEFIT_FILE, errors),
      sortOrder: parseInteger(record, 'sort_order', BENEFIT_FILE, errors),
    };
  });

  const cardFilters = cardRecords.flatMap((record) => {
    const cardSlug = structuredValue(record.data.card_slug);
    return [...FILTER_COLUMNS].flatMap(([column, filterSlug]) =>
      structuredValue(record.data[column]) === 'Y'
        ? [{ cardSlug, filterSlug }]
        : [],
    );
  });

  if (errors.length > 0) {
    throw new Error(
      `Card catalog validation failed:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    sql: renderSeed(cards, rewards, benefits, cardFilters),
    counts: {
      cards: cards.length,
      rewards: rewards.length,
      benefits: benefits.length,
    },
  };
}

async function main() {
  const rootDir = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
  );
  const checkOnly = process.argv.slice(2).includes('--check');
  const { sql, counts } = await generateSeed(rootDir);
  const seedPath = path.join(rootDir, SEED_FILE);

  if (checkOnly) {
    let currentSeed = '';
    try {
      currentSeed = await readFile(seedPath, 'utf8');
    } catch {
      // A missing generated file is reported as stale below.
    }
    if (currentSeed !== sql) {
      throw new Error(
        `${SEED_FILE} is out of date; run npm run seed:generate and commit the result`,
      );
    }
    console.log(`${SEED_FILE} is up to date`);
    return;
  }

  await writeFile(seedPath, sql);
  console.log(
    `Generated ${SEED_FILE}: ${counts.cards} cards, ${counts.rewards} reward rows, ${counts.benefits} benefits`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
