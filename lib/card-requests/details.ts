export interface RequestReward {
  category_id: number;
  reward_rate: number;
  spend_cap: number | null;
  cap_period: string | null;
  rate_after_cap: number | null;
  notes: string | null;
}
export interface CardDetails {
  card_name: string;
  issuer: string;
  source_url: string;
  filter_ids: number[];
  description: string | null;
  network: string | null;
  credit_level_required: string | null;
  annual_fee: number | null;
  monthly_fee: number | null;
  one_time_fee: number | null;
  foreign_transaction_fee_percent: number | null;
  security_deposit_min: number | null;
  point_value_cents: number | null;
  annual_fee_waived_first_year: boolean | null;
  is_secured: boolean | null;
  reward_type: string | null;
  intro_offer: string | null;
  comments: string | null;
  rewards: RequestReward[];
  benefits: string[];
}
export interface Vocabulary {
  filters: ReadonlySet<number>;
  categories: ReadonlySet<number>;
}
export class DetailsError extends Error {
  constructor(public fields: Record<string, string>) {
    super('Check the highlighted fields.');
  }
}
function numeric(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim()))
    return Number(value);
  return NaN;
}
export function parseDetails(
  value: unknown,
  vocabulary: Vocabulary,
  publish = false,
  draft = false,
): CardDetails {
  const fields: Record<string, string> = {};
  const raw =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  function text(key: string, max: number, required = false): string | null {
    const v = raw[key];
    if (v != null && typeof v !== 'string') fields[key] = 'Enter text.';
    const t = typeof v === 'string' ? v.trim() : '';
    if ((required && !t) || t.length > max)
      fields[key] = `Enter ${required ? '1–' : 'up to '}${max} characters.`;
    return t || null;
  }
  function number(
    key: string,
    max = 99999999.99,
    positive = false,
  ): number | null {
    const v = raw[key];
    if (v == null || v === '') return null;
    const n = numeric(v);
    if (!Number.isFinite(n) || n < 0 || n > max || (positive && n === 0))
      fields[key] = 'Enter a valid amount in the supported range.';
    return n;
  }
  function choice(key: string, allowed: string[]): string | null {
    const t = text(key, 40);
    if (t && !allowed.includes(t)) fields[key] = 'Choose a listed option.';
    return t;
  }
  function boolean(key: string): boolean | null {
    const v = raw[key];
    if (v == null || v === '') return null;
    if (v === true || v === 'true') return true;
    if (v === false || v === 'false') return false;
    fields[key] = 'Choose Yes or No.';
    return null;
  }
  const source_url = text('source_url', publish ? 255 : 2048, !draft) ?? '';
  if (source_url) {
    try {
      const url = new URL(source_url);
      if (url.protocol !== 'https:' || url.username || url.password)
        throw Error();
    } catch {
      fields.source_url =
        'Enter a complete HTTPS card URL without credentials.';
    }
  }
  const filter_ids = Array.isArray(raw.filter_ids)
    ? [...new Set(raw.filter_ids.map(numeric))]
    : [];
  if (
    (!draft && !filter_ids.length) ||
    filter_ids.some((id) => !vocabulary.filters.has(id))
  )
    fields.filter_ids = 'Choose at least one existing catalog tag.';
  const result: CardDetails = {
    card_name: text('card_name', publish ? 100 : 160, !draft) ?? '',
    issuer: text('issuer', publish ? 50 : 120, !draft) ?? '',
    source_url,
    filter_ids,
    description: text('description', 2000),
    network: choice('network', ['visa', 'mastercard', 'amex', 'discover']),
    credit_level_required: choice('credit_level_required', [
      'none',
      'fair',
      'good',
      'excellent',
    ]),
    annual_fee: number('annual_fee'),
    monthly_fee: number('monthly_fee'),
    one_time_fee: number('one_time_fee'),
    foreign_transaction_fee_percent: number(
      'foreign_transaction_fee_percent',
      100,
    ),
    security_deposit_min: number('security_deposit_min'),
    point_value_cents: number('point_value_cents', 999.999, true),
    annual_fee_waived_first_year: boolean('annual_fee_waived_first_year'),
    is_secured: boolean('is_secured'),
    reward_type: choice('reward_type', ['cashback', 'points', 'miles', 'none']),
    intro_offer: text('intro_offer', 255),
    comments: text('comments', 2000),
    rewards: [],
    benefits: [],
  };
  if (raw.rewards != null && !Array.isArray(raw.rewards))
    fields.rewards = 'Enter valid reward rows.';
  const seen = new Set<number>();
  for (const [i, row] of (Array.isArray(raw.rewards)
    ? raw.rewards
    : []
  ).entries()) {
    if (i >= 50) {
      fields.rewards = 'Use at most 50 reward rows.';
      break;
    }
    const r = row && typeof row === 'object' ? row : {};
    const category_id = numeric(r.category_id),
      rate = numeric(r.reward_rate);
    const spend_cap =
      r.spend_cap == null || r.spend_cap === '' ? null : numeric(r.spend_cap);
    const cap_period = r.cap_period || null;
    const rate_after_cap =
      r.rate_after_cap == null || r.rate_after_cap === ''
        ? null
        : numeric(r.rate_after_cap);
    if (
      !vocabulary.categories.has(category_id) ||
      seen.has(category_id) ||
      r.reward_rate == null ||
      r.reward_rate === '' ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 99.99 ||
      (spend_cap !== null &&
        (!Number.isFinite(spend_cap) ||
          spend_cap <= 0 ||
          spend_cap > 99999999.99)) ||
      (spend_cap === null) !== (cap_period === null) ||
      (cap_period !== null &&
        !['month', 'quarter', 'year'].includes(cap_period)) ||
      (rate_after_cap !== null &&
        (spend_cap === null ||
          !Number.isFinite(rate_after_cap) ||
          rate_after_cap < 0 ||
          rate_after_cap > 99.99)) ||
      (r.notes != null &&
        (typeof r.notes !== 'string' || r.notes.length > 2000))
    )
      fields.rewards =
        'Check categories, rates, caps, periods, and notes; categories must be unique.';
    seen.add(category_id);
    result.rewards.push({
      category_id,
      reward_rate: rate,
      spend_cap,
      cap_period,
      rate_after_cap,
      notes: typeof r.notes === 'string' ? r.notes.trim() || null : null,
    });
  }
  if (
    raw.benefits != null &&
    (!Array.isArray(raw.benefits) ||
      raw.benefits.length > 30 ||
      raw.benefits.some(
        (b: unknown) => typeof b !== 'string' || b.length > 1000,
      ))
  )
    fields.benefits = 'Use up to 30 benefits, each at most 1,000 characters.';
  result.benefits = Array.isArray(raw.benefits)
    ? raw.benefits
        .filter((b: unknown): b is string => typeof b === 'string')
        .map((b: string) => b.trim())
        .filter(Boolean)
    : [];
  if (publish) {
    for (const key of [
      'annual_fee',
      'reward_type',
      'is_secured',
      'annual_fee_waived_first_year',
    ] as const)
      if (result[key] === null)
        fields[key] = 'Confirm this detail before publishing.';
    if (
      result.reward_type &&
      result.reward_type !== 'none' &&
      !result.rewards.length
    )
      fields.rewards = 'Add the applicable reward rates.';
    if (result.reward_type === 'none' && result.rewards.length)
      fields.rewards = 'Remove reward rates for a card with no rewards.';
    if (
      ['points', 'miles'].includes(result.reward_type ?? '') &&
      result.point_value_cents === null
    )
      fields.point_value_cents = 'Confirm the point or mile value in cents.';
    if (!result.is_secured && result.security_deposit_min !== null)
      fields.security_deposit_min = 'A deposit requires a secured card.';
  }
  if (Object.keys(fields).length) throw new DetailsError(fields);
  return result;
}
