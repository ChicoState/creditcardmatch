import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import RootLayout from '../../app/layout';
import HomePage from '../../app/page';

describe('HomePage', () => {
  it('links the confirmed landing categories and primary journeys', async () => {
    render(await HomePage());

    expect(
      screen.getByRole('heading', {
        name: "Find the card that's right for you!",
      }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: /Popular Cards/ })).toHaveAttribute(
      'href',
      '/results?filters=popular-cards',
    );
    expect(screen.getByRole('link', { name: /Cashback/ })).toHaveAttribute(
      'href',
      '/results?filters=cashback',
    );
    expect(screen.getByRole('link', { name: 'SURVEY' })).toHaveAttribute(
      'href',
      '/survey',
    );
    expect(screen.getByRole('link', { name: 'START FRESH' })).toHaveAttribute(
      'href',
      '/results',
    );
  });

  it('sets the document language for assistive technologies', () => {
    const layout = RootLayout({ children: 'Content' });

    expect(layout.props.lang).toBe('en');
  });
});
