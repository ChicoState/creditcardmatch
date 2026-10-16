export interface EnumeratedOption {
  label: string;
  value: string;
}

export const INCOME_RANGE_VALUES = [
  'under_40000',
  '40001_to_60000',
  '60001_to_80000',
  '80001_to_100000',
  'over_100000',
] as const;

export const CREDIT_SCORE_RANGE_VALUES = [
  'none',
  'fair',
  'good',
  'excellent',
  'unsure',
] as const;

export const CREDIT_LEVEL_REQUIRED_VALUES = [
  'none',
  'fair',
  'good',
  'excellent',
] as const;

export const REWARD_TYPE_VALUES = [
  'cashback',
  'points',
  'miles',
  'none',
] as const;

export const INCOME_RANGE_OPTIONS = [
  { label: '$40,000 or less', value: INCOME_RANGE_VALUES[0] },
  { label: '$40,001–$60,000', value: INCOME_RANGE_VALUES[1] },
  { label: '$60,001–$80,000', value: INCOME_RANGE_VALUES[2] },
  { label: '$80,001–$100,000', value: INCOME_RANGE_VALUES[3] },
  { label: 'More than $100,000', value: INCOME_RANGE_VALUES[4] },
] as const satisfies readonly EnumeratedOption[];

export const CREDIT_SCORE_OPTIONS = [
  { label: 'Excellent (740+)', value: CREDIT_SCORE_RANGE_VALUES[3] },
  { label: 'Good (670–739)', value: CREDIT_SCORE_RANGE_VALUES[2] },
  { label: 'Fair (580–669)', value: CREDIT_SCORE_RANGE_VALUES[1] },
  { label: 'Building/no score yet', value: CREDIT_SCORE_RANGE_VALUES[0] },
  { label: 'I’m not sure', value: CREDIT_SCORE_RANGE_VALUES[4] },
] as const satisfies readonly EnumeratedOption[];

export const CREDIT_LEVEL_OPTIONS = [
  { label: 'Excellent', value: CREDIT_LEVEL_REQUIRED_VALUES[3] },
  { label: 'Good', value: CREDIT_LEVEL_REQUIRED_VALUES[2] },
  { label: 'Fair', value: CREDIT_LEVEL_REQUIRED_VALUES[1] },
  { label: 'Building', value: CREDIT_LEVEL_REQUIRED_VALUES[0] },
] as const satisfies readonly EnumeratedOption[];

export const REWARD_TYPE_OPTIONS = [
  { label: 'Cash back', value: REWARD_TYPE_VALUES[0] },
  { label: 'Points', value: REWARD_TYPE_VALUES[1] },
  { label: 'Miles', value: REWARD_TYPE_VALUES[2] },
  { label: 'No rewards', value: REWARD_TYPE_VALUES[3] },
] as const satisfies readonly EnumeratedOption[];
