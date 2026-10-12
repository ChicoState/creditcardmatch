export interface SurveyValues {
  acceptsAnnualFee: boolean | null;
  categorySpend: Record<string, string>;
  creditScore: string;
  extraBenefits: string[];
  incomeRange: string;
  primaryGoal: string;
  priorityCategories: string[];
}
