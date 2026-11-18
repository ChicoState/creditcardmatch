import type { CatalogCard, RewardCategoryRow } from '../catalog/types';
import type { SurveySubmission } from '../config/survey';

export interface AccountSpendSummary {
  categoryName: string;
  monthlyAmount: number;
}

export interface AccountDashboardData {
  username: string;
  roster: CatalogCard[];
  availableCards: CatalogCard[];
  rewardCategories: RewardCategoryRow[];
  spend: AccountSpendSummary[];
  savedSurvey: SavedSurveyData | null;
}

export interface SavedSurveyData {
  answers: SurveySubmission;
  savedAt: string | null;
}
