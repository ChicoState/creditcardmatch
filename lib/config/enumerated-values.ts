export interface EnumeratedOption {
  label: string;
  value: string;
}

export const INCOME_RANGE_OPTIONS = [
  { label: '$40,000 or less', value: 'under_40000' },
  { label: '$40,001–$60,000', value: '40001_to_60000' },
  { label: '$60,001–$80,000', value: '60001_to_80000' },
  { label: '$80,001–$100,000', value: '80001_to_100000' },
  { label: 'More than $100,000', value: 'over_100000' },
] as const satisfies readonly EnumeratedOption[];

export const CREDIT_SCORE_OPTIONS = [
  { label: 'Excellent (740+)', value: 'excellent' },
  { label: 'Good (670–739)', value: 'good' },
  { label: 'Fair (580–669)', value: 'fair' },
  { label: 'Building/no score yet', value: 'no_history' },
  { label: 'I’m not sure', value: 'unsure' },
] as const satisfies readonly EnumeratedOption[];

export const CREDIT_LEVEL_OPTIONS = [
  { label: 'Excellent', value: 'excellent' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Building', value: 'building' },
] as const satisfies readonly EnumeratedOption[];

export const REWARD_TYPE_OPTIONS = [
  { label: 'Cash back', value: 'cashback' },
  { label: 'Points', value: 'points' },
  { label: 'Miles', value: 'miles' },
] as const satisfies readonly EnumeratedOption[];
