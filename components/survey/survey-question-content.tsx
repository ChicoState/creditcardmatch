import {
  SURVEY_CATEGORIES,
  SURVEY_CONFIG,
  type SurveyCategory,
} from '../../lib/config/survey';

import type { SurveyValues } from './types';

interface SurveyQuestionContentProps {
  onChangeCategorySpend: (categorySlug: string, amount: string) => void;
  onSelectAnnualFee: (acceptsAnnualFee: boolean) => void;
  onSelectCreditScore: (creditScore: string) => void;
  onSelectIncomeRange: (incomeRange: string) => void;
  onSelectPrimaryGoal: (primaryGoal: string) => void;
  onToggleExtraBenefit: (benefitSlug: string) => void;
  onTogglePriorityCategory: (categorySlug: string) => void;
  step: number;
  values: SurveyValues;
}

function OptionList({
  checkedValues,
  name,
  onChange,
  options,
  type,
}: {
  checkedValues: string[];
  name: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ label: string; value: string }>;
  type: 'checkbox' | 'radio';
}) {
  return (
    <div className="answer-list">
      {options.map((option) => (
        <label className="choice-row" key={option.value}>
          <input
            checked={checkedValues.includes(option.value)}
            name={name}
            onChange={() => onChange(option.value)}
            required={type === 'radio'}
            type={type}
            value={option.value}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function CategoryList({
  onTogglePriorityCategory,
  priorityCategories,
}: {
  onTogglePriorityCategory: (categorySlug: string) => void;
  priorityCategories: string[];
}) {
  const maximumReached =
    priorityCategories.length >= SURVEY_CONFIG.priorityCategories.maxSelections;

  return (
    <div className="answer-list">
      {SURVEY_CATEGORIES.map((category) => {
        const selected = priorityCategories.includes(category.slug);

        return (
          <label className="choice-row" key={category.slug}>
            <input
              checked={selected}
              disabled={maximumReached && !selected}
              name="priority-categories"
              onChange={() => onTogglePriorityCategory(category.slug)}
              type="checkbox"
              value={category.slug}
            />
            <span>{category.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function SpendInputs({
  categorySpend,
  onChangeCategorySpend,
  priorityCategories,
}: {
  categorySpend: Record<string, string>;
  onChangeCategorySpend: (categorySlug: string, amount: string) => void;
  priorityCategories: string[];
}) {
  const categories: SurveyCategory[] = priorityCategories.flatMap((slug) => {
    const category = SURVEY_CATEGORIES.find((option) => option.slug === slug);
    return category ? [category] : [];
  });

  return (
    <div className="spend-grid">
      {categories.map((category) => (
        <div className="spend-field" key={category.slug}>
          <label htmlFor={`monthly-spend-${category.slug}`}>
            {category.label}
          </label>
          <span className="currency-input">
            <span aria-hidden="true">$</span>
            <input
              id={`monthly-spend-${category.slug}`}
              inputMode="decimal"
              min="0"
              onChange={(event) =>
                onChangeCategorySpend(category.slug, event.target.value)
              }
              placeholder="0"
              step="0.01"
              type="number"
              value={categorySpend[category.slug] ?? ''}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export function SurveyQuestionContent({
  onChangeCategorySpend,
  onSelectAnnualFee,
  onSelectCreditScore,
  onSelectIncomeRange,
  onSelectPrimaryGoal,
  onToggleExtraBenefit,
  onTogglePriorityCategory,
  step,
  values,
}: SurveyQuestionContentProps) {
  if (step === 0) {
    return (
      <OptionList
        checkedValues={[values.incomeRange]}
        name="income-range"
        onChange={onSelectIncomeRange}
        options={SURVEY_CONFIG.income.options}
        type="radio"
      />
    );
  }

  if (step === 1) {
    return (
      <OptionList
        checkedValues={[values.creditScore]}
        name="credit-score"
        onChange={onSelectCreditScore}
        options={SURVEY_CONFIG.creditScore.options}
        type="radio"
      />
    );
  }

  if (step === 2) {
    return (
      <OptionList
        checkedValues={[values.primaryGoal]}
        name="primary-goal"
        onChange={onSelectPrimaryGoal}
        options={SURVEY_CONFIG.primaryGoal.options}
        type="radio"
      />
    );
  }

  if (step === 3) {
    return (
      <CategoryList
        onTogglePriorityCategory={onTogglePriorityCategory}
        priorityCategories={values.priorityCategories}
      />
    );
  }

  if (step === 4) {
    return (
      <SpendInputs
        categorySpend={values.categorySpend}
        onChangeCategorySpend={onChangeCategorySpend}
        priorityCategories={values.priorityCategories}
      />
    );
  }

  if (step === 5) {
    return (
      <div className="answer-list">
        {SURVEY_CONFIG.annualFee.options.map((option) => (
          <label className="choice-row" key={String(option.value)}>
            <input
              checked={values.acceptsAnnualFee === option.value}
              name="accepts-annual-fee"
              onChange={() => onSelectAnnualFee(option.value)}
              required
              type="radio"
              value={String(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <OptionList
      checkedValues={values.extraBenefits}
      name="extra-benefits"
      onChange={onToggleExtraBenefit}
      options={SURVEY_CONFIG.extraBenefits.options}
      type="checkbox"
    />
  );
}
