import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import { describe, expect, it } from 'vitest';

import RootLayout from '../../app/layout';
import HomePage from '../../app/page';

describe('HomePage', () => {
  it('shows the dashboard panel by default and lets visitors choose another tab', async () => {
    const user = userEvent.setup();

    render(createElement(HomePage));

    expect(
      screen.getByRole('heading', { name: 'Credit Card Match' }),
    ).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Dashboard' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('Your dashboard will appear here.')).toBeVisible();

    await user.click(screen.getByRole('tab', { name: 'My Cards' }));

    expect(screen.getByRole('tab', { name: 'My Cards' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByText('Your saved cards will appear here.'),
    ).toBeVisible();

    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Matches' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(
      screen.getByText('Your card matches will appear here.'),
    ).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Matches' })).toHaveFocus();
  });

  it('sets the document language for assistive technologies', () => {
    const layout = RootLayout({ children: 'Content' });

    expect(layout.props.lang).toBe('en');
  });
});
