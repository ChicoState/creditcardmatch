'use client';

import { useState } from 'react';
import type { CardDetails, RequestReward } from '../lib/card-requests/details';
import type { FilterRow, RewardCategoryRow } from '../lib/catalog/types';

export function readCardDetails(form: HTMLFormElement) {
  const data = new FormData(form);
  return {
    ...Object.fromEntries(data),
    filter_ids: data.getAll('filter_ids').map(Number),
    benefits: String(data.get('benefits') ?? '')
      .split('\n')
      .filter((s) => s.trim()),
    rewards: data
      .getAll('reward_row')
      .map((id) =>
        Object.fromEntries(
          [
            'category_id',
            'reward_rate',
            'spend_cap',
            'cap_period',
            'rate_after_cap',
            'notes',
          ].map((key) => [key, data.get(`reward_${id}_${key}`)]),
        ),
      ),
  };
}
const moneyFields = [
  ['annual_fee', 'Annual fee ($)'],
  ['monthly_fee', 'Monthly fee ($)'],
  ['one_time_fee', 'One-time fee ($)'],
  ['foreign_transaction_fee_percent', 'Foreign transaction fee (%)'],
  ['security_deposit_min', 'Minimum security deposit ($)'],
  ['point_value_cents', 'Point or mile value (cents)'],
] as const;
export function CardDetailFields({
  initial,
  filters,
  categories,
  errors = {},
  draft = false,
}: {
  initial?: Partial<CardDetails>;
  filters: FilterRow[];
  categories: RewardCategoryRow[];
  errors?: Record<string, string>;
  draft?: boolean;
}) {
  const [rows, setRows] = useState<
    (Partial<RequestReward> & { key: number })[]
  >((initial?.rewards ?? []).map((r, key) => ({ ...r, key })));
  const [nextKey, setNextKey] = useState(rows.length);
  function error(name: string) {
    return errors[name] ? (
      <span className="form-error" id={`error-${name}`}>
        {errors[name]}
      </span>
    ) : null;
  }
  function text(
    name: keyof CardDetails,
    label: string,
    max: number,
    required = false,
    type = 'text',
  ) {
    return (
      <label>
        {label}
        {!required ? ' (optional)' : ''}
        <input
          name={name}
          type={type}
          aria-label={`${label}${required ? '' : ' (optional)'}`}
          maxLength={max}
          required={required && !draft}
          defaultValue={String(initial?.[name] ?? '')}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `error-${name}` : undefined}
        />
        {error(name)}
      </label>
    );
  }
  function select(name: keyof CardDetails, label: string, options: string[]) {
    return (
      <label>
        {label}
        <select
          aria-label={label}
          aria-describedby={errors[name] ? `error-${name}` : undefined}
          name={name}
          defaultValue={String(initial?.[name] ?? '')}
          aria-invalid={!!errors[name]}
        >
          <option value="">Unknown</option>
          {options.map((v) => (
            <option key={v} value={v}>
              {v === 'true'
                ? 'Yes'
                : v === 'false'
                  ? 'No'
                  : v.replaceAll('_', ' ')}
            </option>
          ))}
        </select>
        {error(name)}
      </label>
    );
  }
  return (
    <>
      <fieldset>
        <legend>Card basics</legend>
        {text('card_name', 'Card name', 160, true)}
        {text('issuer', 'Issuer', 120, true)}
        {text('source_url', 'Official card URL', 2048, true, 'url')}
        <fieldset aria-describedby="tag-help">
          <legend>Catalog filter tags (choose at least one)</legend>
          <p id="tag-help">
            Choose existing tags that describe the card. These are separate from
            reward spending categories.
          </p>
          {filters.map((f) => (
            <label className="card-request-form__checkbox" key={f.filter_id}>
              <input
                name="filter_ids"
                type="checkbox"
                value={f.filter_id}
                defaultChecked={initial?.filter_ids?.includes(f.filter_id)}
              />
              {f.label}
            </label>
          ))}
          {error('filter_ids')}
        </fieldset>
      </fieldset>
      <details
        open={
          draft ||
          Object.keys(errors).some(
            (k) =>
              !['card_name', 'issuer', 'source_url', 'filter_ids'].includes(k),
          )
        }
      >
        <summary>Additional card details (optional for submission)</summary>
        <fieldset>
          <legend>Details and fees</legend>
          {text('description', 'Description', 2000)}
          {select('network', 'Network', [
            'visa',
            'mastercard',
            'amex',
            'discover',
          ])}
          {select('credit_level_required', 'Credit required', [
            'none',
            'fair',
            'good',
            'excellent',
          ])}
          {moneyFields.map(([name, label]) => (
            <label key={name}>
              {label} (optional)
              <input
                name={name}
                type="number"
                aria-label={`${label} (optional)`}
                aria-describedby={errors[name] ? `error-${name}` : undefined}
                min={name === 'point_value_cents' ? '0.001' : '0'}
                max={
                  name === 'point_value_cents'
                    ? '999.999'
                    : name === 'foreign_transaction_fee_percent'
                      ? '100'
                      : '99999999.99'
                }
                step={name === 'point_value_cents' ? '0.001' : '0.01'}
                defaultValue={initial?.[name] ?? ''}
                aria-invalid={!!errors[name]}
              />
              {error(name)}
            </label>
          ))}
          {select(
            'annual_fee_waived_first_year',
            'Annual fee waived in first year',
            ['true', 'false'],
          )}
          {select('is_secured', 'Secured card', ['true', 'false'])}
        </fieldset>
        <fieldset>
          <legend>Rewards</legend>
          {select('reward_type', 'Reward type', [
            'cashback',
            'points',
            'miles',
            'none',
          ])}
          <p>
            Rates are percentages for cashback (3 means 3%) or points/miles per
            $1 (3 means 3×). Leave unknown amounts blank.
          </p>
          {rows.map((row) => (
            <fieldset key={row.key}>
              <legend>Reward category {rows.indexOf(row) + 1}</legend>
              <input type="hidden" name="reward_row" value={row.key} />
              <label>
                Spending category
                <select
                  name={`reward_${row.key}_category_id`}
                  defaultValue={row.category_id ?? ''}
                >
                  <option value="">Choose a category</option>
                  {categories.map((c) => (
                    <option key={c.category_id} value={c.category_id}>
                      {c.category_name}
                    </option>
                  ))}
                </select>
              </label>
              {(['reward_rate', 'spend_cap', 'rate_after_cap'] as const).map(
                (key, i) => (
                  <label key={key}>
                    {
                      [
                        'Reward rate',
                        'Spend cap ($, optional)',
                        'Rate after cap (optional)',
                      ][i]
                    }
                    <input
                      name={`reward_${row.key}_${key}`}
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={row[key] ?? ''}
                    />
                  </label>
                ),
              )}
              <label>
                Cap period
                <select
                  name={`reward_${row.key}_cap_period`}
                  defaultValue={row.cap_period ?? ''}
                >
                  <option value="">No cap</option>
                  {['month', 'quarter', 'year'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label>
                Reward notes (optional)
                <textarea
                  maxLength={2000}
                  name={`reward_${row.key}_notes`}
                  defaultValue={row.notes ?? ''}
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => setRows(rows.filter((r) => r.key !== row.key))}
              >
                Remove reward category {rows.indexOf(row) + 1}
              </button>
            </fieldset>
          ))}
          {error('rewards')}
          <button
            type="button"
            className="secondary-action"
            disabled={rows.length >= categories.length}
            onClick={() => {
              setRows([...rows, { key: nextKey }]);
              setNextKey(nextKey + 1);
            }}
          >
            Add reward category
          </button>
        </fieldset>
        <fieldset>
          <legend>Offers and benefits</legend>
          {text('intro_offer', 'Introductory offer', 255)}
          <label>
            Benefits (optional, one per line in display order)
            <textarea
              name="benefits"
              rows={5}
              defaultValue={initial?.benefits?.join('\n') ?? ''}
            />
            {error('benefits')}
          </label>
        </fieldset>
      </details>
      <label>
        Requester notes (optional)
        <textarea
          name="comments"
          maxLength={2000}
          rows={4}
          defaultValue={initial?.comments ?? ''}
        />
        {error('comments')}
      </label>
    </>
  );
}
