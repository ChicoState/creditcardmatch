/**
 * These are the questions for the interactive survey.
 * Questions are subject to change
 * 
 */

export type Question = {
  id: string;
  prompt: string;
  helpText: string;
  options: readonly string[];
  type: 'single' | 'multiple'; // response type
  maxSelections?: number;
  exclusiveOption?: string;
};

export const questions: readonly Question[] = [
  {
    id: 'income',
    prompt: 'How much do you earn annually?',
    helpText: 'Choose the range that best represents your annual income.',
    options: [
      '$40,000 or less',
      '$40,001–$60,000',
      '$60,001–$80,000',
      '$80,001–$100,000',
      'More than $100,000',
    ],
    type: 'single',
  },
  {
    id: 'creditScore',
    prompt: 'What is your estimated credit score?',
    helpText: 'An estimate is enough; choose “I’m not sure” if you do not know.',
    options: [
      'Excellent (740+)',
      'Good (670–739)',
      'Fair (580–669)',
      'Building/no score yet',
      'I’m not sure',
    ],
    type: 'single',
  },
  {
    id: 'goal',
    prompt: 'What do you want most from a card?',
    helpText: 'Select the benefit that matters most to you right now.',
    options: [
      'Cash back',
      'Travel rewards',
      'Building credit',
      'Low or no annual fee',
      'Introductory 0% APR',
    ],
    type: 'single',
  },
  {
    id: 'categories',
    prompt: 'Which spending categories matter most to you?',
    helpText: 'Select up to three categories.',
    options: [
      'Groceries',
      'Dining/food delivery',
      'Gas',
      'Travel',
      'Shopping',
      'Transit/rideshare',
      'Streaming/entertainment',
      'Everyday purchases',
    ],
    type: 'multiple',
    maxSelections: 3,
  },
  {
    id: 'annualFee',
    prompt: 'Are you comfortable paying an annual card fee?',
    helpText: 'Choose the highest annual fee you would consider.',
    options: [
      'No — $0 annual fee only',
      'Up to $95 per year',
      'Up to $250 per year',
      'Higher fees are okay if the benefits are worthwhile',
    ],
    type: 'single',
  },
  {
    id: 'benefits',
    prompt: 'Which extra benefits interest you?',
    helpText: 'Select every benefit that matters to you.',
    options: [
      'No foreign transaction fee',
      'Airport/travel benefits',
      'Purchase protection',
      'Welcome bonus',
      'Balance-transfer offer',
      'None in particular',
    ],
    type: 'multiple',
    exclusiveOption: 'None in particular',
  },
];
