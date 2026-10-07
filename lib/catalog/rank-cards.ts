import type { SurveySubmission } from '../config/survey';
import type { CatalogCard } from './types';

export interface RankingContext {
  activeFilters: string[];
  surveyAnswers: SurveySubmission | null;
}

export function rankCards(
  cards: CatalogCard[],
  context: RankingContext,
): CatalogCard[] {
  // TODO(TBD): Replace alphabetical ordering when the ranking strategy is decided.
  void context;
  return [...cards].sort((left, right) =>
    left.cardName.localeCompare(right.cardName),
  );
}
