import {
  CREDIT_SCORE_OPTIONS,
  INCOME_RANGE_OPTIONS,
} from '../lib/config/enumerated-values';
import {
  EXTRA_BENEFIT_OPTIONS,
  PRIMARY_GOAL_OPTIONS,
  SURVEY_CATEGORIES,
  type SurveySubmission,
} from '../lib/config/survey';

interface SurveyAnswerSummaryProps {
  answers: SurveySubmission;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

function optionLabel(
  options: readonly { label: string; value: string }[],
  value: string,
): string {
  return options.find((option) => option.value === value)?.label ?? value;
}

export function SurveyAnswerSummary({ answers }: SurveyAnswerSummaryProps) {
  const categorySpendBySlug = new Map(
    answers.category_monthly_spend.map((item) => [
      item.category_slug,
      item.monthly_amount,
    ]),
  );
  const benefitLabels = answers.extra_benefit_slugs.map((slug) =>
    optionLabel(EXTRA_BENEFIT_OPTIONS, slug),
  );

  return (
    <details className="survey-answer-summary">
      <summary>Your answers</summary>
      <div className="survey-answer-content">
        <p className="eyebrow">Reference</p>
        <h3 id="survey-answers-heading">What we used for matching</h3>
        <dl>
          <div>
            <dt>Priority categories</dt>
            <dd>
              {answers.priority_category_slugs.length > 0 ? (
                <ul>
                  {answers.priority_category_slugs.map((slug) => {
                    const category = SURVEY_CATEGORIES.find(
                      (option) => option.slug === slug,
                    );
                    const amount = categorySpendBySlug.get(slug);

                    return (
                      <li key={slug}>
                        {category?.label ?? slug}
                        {amount !== undefined
                          ? ` · ${formatCurrency(amount)}/month`
                          : ' · spending amount not used yet'}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                'None selected'
              )}
            </dd>
          </div>
          <div>
            <dt>Credit score range</dt>
            <dd>
              {optionLabel(CREDIT_SCORE_OPTIONS, answers.credit_score_band)}
            </dd>
          </div>
          <div>
            <dt>Annual fee</dt>
            <dd>
              {answers.accepts_annual_fee
                ? 'Would consider one'
                : 'Low or no annual fee'}
            </dd>
          </div>
          <div>
            <dt>Primary goal</dt>
            <dd>{optionLabel(PRIMARY_GOAL_OPTIONS, answers.primary_goal)}</dd>
          </div>
          <div>
            <dt>Income range</dt>
            <dd>{optionLabel(INCOME_RANGE_OPTIONS, answers.income_range)}</dd>
          </div>
          <div>
            <dt>Extra benefits</dt>
            <dd>
              {benefitLabels.length > 0
                ? benefitLabels.join(', ')
                : 'None selected'}
            </dd>
          </div>
        </dl>
      </div>
    </details>
  );
}
