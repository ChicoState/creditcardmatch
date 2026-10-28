import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import { ResultsExplorer } from '../../components/results-explorer';
import { ComparisonProvider } from '../../components/comparison-provider';
import type { SurveySubmission } from '../../lib/config/survey';
import { selectVisibleCatalogCards } from '../../lib/catalog/visibility';
import {
  clearSurveyAnswers,
  saveSurveyAnswers,
} from '../../lib/storage/survey-storage';
import { catalogFixture } from '../fixtures/catalog';

afterEach(() => {
  clearSurveyAnswers();
  cleanup();
});

describe('ResultsExplorer card details', () => {
  it('shows a secure issuer apply link with an accessible new-tab name', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
      />,
      { wrapper: ComparisonProvider },
    );

    const link = screen.getByRole('link', {
      name: "Apply for Harbor Starter Card on Fictional Harbor Bank's site (opens in a new tab)",
    });
    expect(link).toHaveAttribute('href', 'https://harbor.example/apply');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('hides apply links when the catalog does not provide a URL', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards({
          ...catalogFixture,
          creditCards: catalogFixture.creditCards.map((card) => ({
            ...card,
            apply_url: null,
          })),
        })}
        filters={catalogFixture.filters}
      />,
      { wrapper: ComparisonProvider },
    );

    expect(
      screen.queryByRole('link', { name: /Apply for/ }),
    ).not.toBeInTheDocument();
  });

  it('does not render non-HTTPS apply URLs', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={[
          {
            ...selectVisibleCatalogCards(catalogFixture)[0],
            applyUrl: 'http://harbor.example/apply',
          },
        ]}
        filters={catalogFixture.filters}
      />,
      { wrapper: ComparisonProvider },
    );

    expect(
      screen.queryByRole('link', { name: /Apply for/ }),
    ).not.toBeInTheDocument();
  });

  it('shows confirmed fees, secured deposit, and no-rewards status compactly', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
      />,
      { wrapper: ComparisonProvider },
    );

    const card = screen
      .getByRole('heading', { name: 'Harbor Starter Card' })
      .closest('article');
    expect(card).not.toBeNull();
    const details = within(card as HTMLElement);

    expect(details.getByText('$0 first year')).toBeVisible();
    expect(details.getByText('$25')).toBeVisible();
    expect(details.getByText('$5')).toBeVisible();
    expect(details.getByText('Secured · $49 minimum deposit')).toBeVisible();
    expect(details.getByText('No rewards')).toBeVisible();
    expect(details.getByText('Mastercard')).toBeVisible();
  });

  it('hides zero and unconfirmed one-time or monthly fees', () => {
    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
      />,
      { wrapper: ComparisonProvider },
    );

    const card = screen
      .getByRole('heading', { name: 'Aurora Everyday Card' })
      .closest('article');
    expect(card).not.toBeNull();
    const details = within(card as HTMLElement);

    expect(details.queryByText('One-time fee')).not.toBeInTheDocument();
    expect(details.queryByText('Monthly fee')).not.toBeInTheDocument();
    expect(details.queryByText(/^Secured/)).not.toBeInTheDocument();
    expect(details.queryByText('No rewards')).not.toBeInTheDocument();
  });

  it('loads saved answers and labels cards by their relative fit', async () => {
    const surveyAnswers: SurveySubmission = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [],
      credit_score_band: 'none',
      extra_benefit_slugs: [],
      income_range: 'under_40000',
      primary_goal: 'building_credit',
      priority_category_slugs: [],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: false,
      },
    };
    saveSurveyAnswers(surveyAnswers);

    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
        mode="survey"
      />,
      { wrapper: ComparisonProvider },
    );

    await waitFor(() => {
      expect(
        screen
          .getByRole('heading', { name: 'Harbor Starter Card' })
          .closest('article'),
      ).toHaveTextContent('Best match');
    });
    expect(
      screen
        .getByRole('heading', { name: 'Aurora Everyday Card' })
        .closest('article'),
    ).not.toHaveTextContent('Alternative');
  });

  it('explains survey ordering, badges, and broader fallback results', async () => {
    const surveyAnswers: SurveySubmission = {
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [
        { category_slug: 'dining', monthly_amount: 400 },
      ],
      credit_score_band: 'good',
      extra_benefit_slugs: [],
      income_range: 'under_40000',
      primary_goal: 'cash_back',
      priority_category_slugs: ['dining'],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: false,
      },
    };
    saveSurveyAnswers(surveyAnswers);

    render(
      <ResultsExplorer
        activeFilters={[]}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
        mode="survey"
      />,
      { wrapper: ComparisonProvider },
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'Cards ranked by how well they fit your answers',
        }),
      ).toBeVisible();
    });
    expect(
      screen.getByText(
        'We could not find a card that directly rewards your selected categories. These broader options are shown so you still have cards to compare.',
      ),
    ).toBeVisible();
    expect(screen.getByText('Best match')).toBeVisible();
    expect(screen.getByText('Okay')).toBeVisible();
    expect(screen.queryByText('Control TBD')).not.toBeInTheDocument();
  });

  it('explains when survey filters leave no cards to recommend', async () => {
    saveSurveyAnswers({
      accepts_annual_fee: false,
      card_filter_preferences: [],
      category_monthly_spend: [],
      credit_score_band: 'good',
      extra_benefit_slugs: [],
      income_range: 'under_40000',
      primary_goal: 'cash_back',
      priority_category_slugs: [],
      user_filter_preferences: [],
      user_preferences: {
        accepts_annual_fee: false,
        wants_travel_rewards: false,
      },
    });

    render(
      <ResultsExplorer
        activeFilters={['popular-cards', 'no-credit-history']}
        cards={selectVisibleCatalogCards(catalogFixture)}
        filters={catalogFixture.filters}
        mode="survey"
      />,
      { wrapper: ComparisonProvider },
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: 'No cards match all of these choices yet',
        }),
      ).toBeVisible();
    });
    expect(
      screen.getByText(
        'Try removing a filter or changing your search to see more cards.',
      ),
    ).toBeVisible();
  });
});
