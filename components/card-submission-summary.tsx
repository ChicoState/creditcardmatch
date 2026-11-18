import type { CardDetails } from '../lib/card-requests/details';
import type { CatalogSnapshot } from '../lib/catalog/types';
const labels: Partial<Record<keyof CardDetails, string>> = {
  card_name: 'Card name',
  issuer: 'Issuer',
  source_url: 'Official card URL',
  description: 'Description',
  network: 'Network',
  credit_level_required: 'Credit required',
  annual_fee: 'Annual fee ($)',
  monthly_fee: 'Monthly fee ($)',
  one_time_fee: 'One-time fee ($)',
  foreign_transaction_fee_percent: 'Foreign transaction fee (%)',
  security_deposit_min: 'Minimum security deposit ($)',
  point_value_cents: 'Point or mile value (cents)',
  annual_fee_waived_first_year: 'First-year annual fee waived',
  is_secured: 'Secured card',
  reward_type: 'Reward type',
  intro_offer: 'Introductory offer',
  comments: 'Requester notes',
};
export function CardSubmissionSummary({
  details,
  catalog,
}: {
  details: Partial<CardDetails>;
  catalog: CatalogSnapshot;
}) {
  return (
    <div>
      <dl>
        {Object.entries(labels).map(([key, label]) => {
          const value = details[key as keyof CardDetails];
          return (
            <div key={key}>
              <dt>{label}</dt>
              <dd>
                {value == null || value === ''
                  ? 'Unknown'
                  : typeof value === 'boolean'
                    ? value
                      ? 'Yes'
                      : 'No'
                    : String(value)}
              </dd>
            </div>
          );
        })}
        <dt>Catalog tags</dt>
        <dd>
          {(details.filter_ids ?? [])
            .map(
              (id) =>
                catalog.filters.find((f) => f.filter_id === id)?.label ??
                'Unavailable tag',
            )
            .join(', ') || 'None'}
        </dd>
      </dl>
      <h3>Reward rates</h3>
      {details.rewards?.length ? (
        <ul>
          {details.rewards.map((r) => (
            <li key={r.category_id}>
              {catalog.rewardCategories.find(
                (c) => c.category_id === r.category_id,
              )?.category_name ?? 'Unavailable category'}
              : {r.reward_rate}
              {details.reward_type === 'cashback' ? '%' : ' per $1'}
              {r.spend_cap !== null
                ? ` · Cap $${r.spend_cap} per ${r.cap_period}`
                : ''}
              {r.rate_after_cap !== null
                ? ` · After cap: ${r.rate_after_cap}`
                : ''}
              {r.notes ? ` · ${r.notes}` : ''}
            </li>
          ))}
        </ul>
      ) : (
        <p>No rates supplied.</p>
      )}
      <h3>Benefits</h3>
      {details.benefits?.length ? (
        <ol>
          {details.benefits.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ol>
      ) : (
        <p>No benefits supplied.</p>
      )}
    </div>
  );
}
