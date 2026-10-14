export interface EnumeratedOption {
  value: string;
  label: string;
}

// TODO(TBD): Replace the placeholder income ranges after the team confirms them.
export const INCOME_RANGE_OPTIONS: EnumeratedOption[] = [
  { value: 'income_placeholder_low', label: 'Income range A (TBD)' },
  { value: 'income_placeholder_mid', label: 'Income range B (TBD)' },
  { value: 'income_placeholder_high', label: 'Income range C (TBD)' },
];

export const CREDIT_SCORE_RANGE_OPTIONS: EnumeratedOption[] = [
  { value: 'none', label: 'No credit history' },
  { value: 'fair', label: 'Fair credit' },
  { value: 'good', label: 'Good credit' },
  { value: 'excellent', label: 'Excellent credit' },
];

export const CREDIT_LEVEL_REQUIRED_OPTIONS: EnumeratedOption[] = [
  { value: 'none', label: 'No credit history' },
  { value: 'fair', label: 'Fair credit' },
  { value: 'good', label: 'Good credit' },
  { value: 'excellent', label: 'Excellent credit' },
];

export const REWARD_TYPE_OPTIONS: EnumeratedOption[] = [
  { value: 'cashback', label: 'Cashback' },
  { value: 'points', label: 'Points' },
  { value: 'miles', label: 'Miles' },
  { value: 'none', label: 'No rewards' },
];
