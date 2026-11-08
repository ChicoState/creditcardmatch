const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export interface CardRequestInput {
  cardName: string;
  issuer: string;
  rewardTypes: string[];
  notificationEmail: string | null;
  comments: string | null;
}

export function parseCardRequest(
  formData: FormData,
  allowedRewardTypes: ReadonlySet<string>,
): CardRequestInput {
  const cardName = textValue(formData.get('card_name')).trim();
  const issuer = textValue(formData.get('issuer')).trim();
  const rewardTypes = uniqueValues(formData.getAll('reward_type'));
  const notificationEmail = optionalText(formData.get('notification_email'));
  const comments = optionalText(formData.get('comments'));

  if (cardName.length < 1 || cardName.length > 160)
    throw new Error('Enter a card name between 1 and 160 characters.');
  if (issuer.length < 1 || issuer.length > 120)
    throw new Error('Enter an issuer between 1 and 120 characters.');
  if (
    rewardTypes.length < 1 ||
    rewardTypes.length > 4 ||
    rewardTypes.some((type) => !allowedRewardTypes.has(type))
  ) {
    throw new Error('Choose at least one valid reward category.');
  }
  if (notificationEmail && !EMAIL_PATTERN.test(notificationEmail))
    throw new Error('Enter a valid notification email address.');
  if (comments && comments.length > 2000)
    throw new Error('Comments must be 2,000 characters or fewer.');

  return { cardName, issuer, rewardTypes, notificationEmail, comments };
}

function textValue(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value : '';
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = textValue(value).trim();
  return text || null;
}

function uniqueValues(values: FormDataEntryValue[]): string[] {
  return [
    ...new Set(
      values.filter((value): value is string => typeof value === 'string'),
    ),
  ];
}
