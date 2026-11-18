import { redirect } from 'next/navigation';

import { getCatalogData } from '../data/catalog';
import { createAuthServerClient } from '../auth/server';
import { selectVisibleCatalogCards } from '../catalog/visibility';
import type { CatalogCard } from '../catalog/types';
import type { AccountDashboardData } from './types';
import { isSurveySubmission } from '../config/survey';
import type { SavedSurveyData } from './types';

export async function getAuthenticatedUser(nextPath = '/account') {
  const { data, error } = await (await createAuthServerClient()).auth.getUser();
  if (error || !data.user) redirect(`/login?next=${nextPath}`);
  return data.user;
}

export async function getAccountDashboardData(): Promise<AccountDashboardData> {
  const user = await getAuthenticatedUser();
  const auth = await createAuthServerClient();

  const [currentCards, spendResult, savedSurveyResult, catalog] =
    await Promise.all([
      getCurrentCardsPageData(user, auth),
      auth
        .from('user_category_spend')
        .select('category_id, monthly_amount')
        .eq('user_id', user.id),
      auth
        .from('user_preferences')
        .select('survey_answers, survey_saved_at')
        .eq('user_id', user.id)
        .maybeSingle(),
      getCatalogData(),
    ]);

  if (spendResult.error)
    throw new Error('Unable to load your saved spending answers.');
  if (savedSurveyResult.error)
    throw new Error('Unable to load your saved survey answers.');

  const categoryById = new Map(
    catalog.rewardCategories.map((category) => [
      category.category_id,
      category.category_name,
    ]),
  );
  const spend = (spendResult.data ?? [])
    .flatMap((row) => {
      const categoryName = categoryById.get(Number(row.category_id));
      return categoryName
        ? [
            {
              categoryName,
              monthlyAmount: Number(row.monthly_amount),
            },
          ]
        : [];
    })
    .sort((left, right) => right.monthlyAmount - left.monthlyAmount);

  return {
    ...currentCards,
    spend,
    savedSurvey:
      savedSurveyResult.data &&
      isSurveySubmission(savedSurveyResult.data.survey_answers)
        ? {
            answers: savedSurveyResult.data.survey_answers,
            savedAt: savedSurveyResult.data.survey_saved_at,
          }
        : null,
  };
}

export async function getSavedSurveyAnswers(): Promise<SavedSurveyData | null> {
  const user = await getAuthenticatedUser('/survey');
  const auth = await createAuthServerClient();
  const { data, error } = await auth
    .from('user_preferences')
    .select('survey_answers, survey_saved_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw new Error('Unable to load your saved survey answers.');
  return data && isSurveySubmission(data.survey_answers)
    ? { answers: data.survey_answers, savedAt: data.survey_saved_at }
    : null;
}

export async function getOptionalSavedSurveyAnswers(): Promise<SavedSurveyData | null> {
  const auth = await createAuthServerClient();
  const { data } = await auth.auth.getUser();
  if (!data.user) return null;

  const { data: saved, error } = await auth
    .from('user_preferences')
    .select('survey_answers, survey_saved_at')
    .eq('user_id', data.user.id)
    .maybeSingle();
  if (error) throw new Error('Unable to load your saved survey answers.');
  return saved && isSurveySubmission(saved.survey_answers)
    ? { answers: saved.survey_answers, savedAt: saved.survey_saved_at }
    : null;
}

export async function getCurrentCardsPageData(
  user?: Awaited<ReturnType<typeof getAuthenticatedUser>>,
  auth?: Awaited<ReturnType<typeof createAuthServerClient>>,
): Promise<Omit<AccountDashboardData, 'spend' | 'savedSurvey'>> {
  const authenticatedUser =
    user ?? (await getAuthenticatedUser('/account/current-cards'));
  const client = auth ?? (await createAuthServerClient());
  const [rosterResult, catalog] = await Promise.all([
    client
      .from('user_card_roster')
      .select('card_id')
      .eq('user_id', authenticatedUser.id),
    getCatalogData(),
  ]);

  if (rosterResult.error) throw new Error('Unable to load your card roster.');

  const visibleCards = selectVisibleCatalogCards(catalog);
  const rosterIds = new Set(
    (rosterResult.data ?? []).map((row) => Number(row.card_id)),
  );

  return {
    username:
      typeof authenticatedUser.user_metadata?.username === 'string'
        ? authenticatedUser.user_metadata.username
        : 'Username unavailable',
    roster: visibleCards.filter((card) => rosterIds.has(card.cardId)),
    availableCards: visibleCards,
    rewardCategories: catalog.rewardCategories,
  };
}

export function availableRosterCards(
  cards: CatalogCard[],
  roster: CatalogCard[],
): CatalogCard[] {
  const rosterIds = new Set(roster.map((card) => card.cardId));
  return cards.filter((card) => !rosterIds.has(card.cardId));
}
