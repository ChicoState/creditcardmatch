import type { CatalogCard } from '../catalog/types';

export interface AccountSpendSummary {
  categoryName: string;
  monthlyAmount: number;
}

export interface AccountDashboardData {
  username: string;
  roster: CatalogCard[];
  availableCards: CatalogCard[];
  spend: AccountSpendSummary[];
}
