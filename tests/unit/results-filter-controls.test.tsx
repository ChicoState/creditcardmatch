import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ResultsFilterControls } from '../../components/results-filter-controls';
import type { FilterRow } from '../../lib/catalog/types';

const filters: FilterRow[] = [
  {
    filter_id: 1,
    slug: 'cashback',
    label: 'Cashback',
    description: 'Cash-back cards',
  },
  {
    filter_id: 2,
    slug: 'no-annual-fee',
    label: 'No Annual Fee',
    description: 'Cards with no annual fee',
  },
];

describe('ResultsFilterControls', () => {
  afterEach(cleanup);

  it('maps active filter slugs to catalog labels and supports removal', async () => {
    const user = userEvent.setup();
    const onRemoveFilter = vi.fn();

    render(
      <ResultsFilterControls
        activeFilters={['cashback', 'unknown-filter']}
        filters={filters}
        onAddFilter={vi.fn()}
        onRemoveFilter={onRemoveFilter}
      />,
    );

    const activeFilters = screen.getByLabelText('Active filters');
    expect(within(activeFilters).getByText('Cashback')).toBeVisible();
    expect(within(activeFilters).getByText('unknown-filter')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Remove Cashback filter' }),
    );
    expect(onRemoveFilter).toHaveBeenCalledWith('cashback');
  });

  it('reports a selected filter from the add-filter control', async () => {
    const user = userEvent.setup();
    const onAddFilter = vi.fn();

    render(
      <ResultsFilterControls
        activeFilters={[]}
        filters={filters}
        onAddFilter={onAddFilter}
        onRemoveFilter={vi.fn()}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Add a filter' }),
      'no-annual-fee',
    );

    expect(onAddFilter).toHaveBeenCalledWith('no-annual-fee');
  });
});
