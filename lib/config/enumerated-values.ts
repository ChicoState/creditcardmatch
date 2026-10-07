export interface EnumeratedOption {
  value: string;
  label: string;
}

// TODO(TBD): Replace all placeholder values and labels after the team confirms
// the allowed income, credit-history, credit-level, and reward-type vocabularies.
export const INCOME_RANGE_OPTIONS: EnumeratedOption[] = [
  { value: 'income_placeholder_low', label: 'Income range A (TBD)' },
  { value: 'income_placeholder_mid', label: 'Income range B (TBD)' },
  { value: 'income_placeholder_high', label: 'Income range C (TBD)' },
];

export const CREDIT_SCORE_RANGE_OPTIONS: EnumeratedOption[] = [
  { value: 'no_history', label: 'No credit history (TBD value)' },
  { value: 'credit_placeholder_building', label: 'Credit range A (TBD)' },
  { value: 'credit_placeholder_established', label: 'Credit range B (TBD)' },
];

export const CREDIT_LEVEL_REQUIRED_OPTIONS: EnumeratedOption[] = [
  { value: 'no_history', label: 'No history (TBD)' },
  { value: 'good', label: 'Credit level A (TBD)' },
];

export const REWARD_TYPE_OPTIONS: EnumeratedOption[] = [
  { value: 'cashback', label: 'Cashback (TBD value)' },
  { value: 'points', label: 'Points (TBD value)' },
];
