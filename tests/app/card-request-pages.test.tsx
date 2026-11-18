import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
afterEach(cleanup);
const mocks = vi.hoisted(() => ({
  submit: vi.fn(),
  review: vi.fn(),
  refresh: vi.fn(),
  history: vi.fn(),
  queue: vi.fn(),
  detail: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock('../../lib/card-requests/actions', () => ({
  submitCardRequest: mocks.submit,
  reviewCardRequest: mocks.review,
}));
vi.mock('../../lib/card-requests/data', () => ({
  getRequestHistory: mocks.history,
  getReviewQueue: mocks.queue,
  getReviewRequest: mocks.detail,
}));
vi.mock('../../lib/account/data', () => ({
  getAuthenticatedUser: async () => ({ id: 'owner' }),
}));
vi.mock('../../lib/data/catalog', () => ({
  getCatalogData: async () => catalog,
}));
import NewPage from '../../app/card-requests/new/page';
import HistoryPage from '../../app/account/card-requests/page';
import QueuePage from '../../app/admin/card-requests/page';
import ReviewPage from '../../app/admin/card-requests/[id]/page';
import { CardRequestForm } from '../../components/card-request-form';
import type { CatalogSnapshot } from '../../lib/catalog/types';
const catalog: CatalogSnapshot = {
  filters: [
    { filter_id: 1, label: 'Cashback', slug: 'cashback', description: null },
  ],
  rewardCategories: [],
  creditCards: [],
  cardRewards: [],
  cardBenefits: [],
  cardFilters: [],
};
const request = {
  request_id: 1,
  revision: 0,
  card_name: 'New Card',
  issuer: 'Bank',
  status: 'pending',
  created_at: '2026-11-16T00:00:00Z',
  reward_types: [],
  submission_details: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  mocks.history.mockResolvedValue([request]);
  mocks.queue.mockResolvedValue({ requests: [request], total: 60 });
  mocks.detail.mockResolvedValue({ request });
  mocks.submit.mockResolvedValue({ ok: true });
  mocks.review.mockResolvedValue({ ok: true });
});
describe('request pages', () => {
  it('renders the dedicated page and requires the core inputs', async () => {
    render(await NewPage());
    expect(
      screen.getByRole('heading', { name: 'Request a missing card' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Card name')).toBeRequired();
    expect(screen.getByLabelText('Issuer')).toBeRequired();
    expect(screen.getByLabelText('Official card URL')).toBeRequired();
  });
  it('retains values after validation errors, then confirms submission', async () => {
    const user = userEvent.setup();
    mocks.submit.mockResolvedValueOnce({
      ok: false,
      code: 'validation',
      message: 'Check the highlighted fields.',
      fields: { source_url: 'Use HTTPS.' },
    });
    render(<CardRequestForm filters={catalog.filters} rewardCategories={[]} />);
    await user.type(screen.getByLabelText('Card name'), 'New Card');
    await user.type(screen.getByLabelText('Issuer'), 'Bank');
    await user.type(
      screen.getByLabelText('Official card URL'),
      'http://example.com',
    );
    await user.click(screen.getByLabelText('Cashback'));
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(await screen.findByText('Use HTTPS.')).toBeVisible();
    expect(screen.getByLabelText('Card name')).toHaveValue('New Card');
    await user.clear(screen.getByLabelText('Official card URL'));
    await user.type(
      screen.getByLabelText('Official card URL'),
      'https://example.com',
    );
    await user.click(screen.getByRole('button', { name: 'Submit request' }));
    expect(
      await screen.findByRole('heading', { name: 'Request submitted' }),
    ).toBeVisible();
  });
  it('shows history and empty history', async () => {
    const first = render(await HistoryPage());
    expect(screen.getByText('Pending')).toBeVisible();
    first.unmount();
    mocks.history.mockResolvedValue([]);
    render(await HistoryPage());
    expect(screen.getByText(/haven’t submitted/)).toBeVisible();
  });
  it('renders review submissions with omitted optional collections', async () => {
    mocks.detail.mockResolvedValue({
      request: {
        ...request,
        submission_details: {
          card_name: 'New Card',
          issuer: 'Bank',
          source_url: 'https://example.com/card',
          filter_ids: [1],
        },
      },
    });
    render(await ReviewPage({ params: Promise.resolve({ id: '1' }) }));
    expect(screen.getByText('No rates supplied.')).toBeInTheDocument();
    expect(screen.getByText('No benefits supplied.')).toBeInTheDocument();
  });
  it('preserves queue filters across pagination', async () => {
    render(
      await QueuePage({
        searchParams: Promise.resolve({ status: 'all', q: 'Bank', page: '2' }),
      }),
    );
    expect(mocks.queue).toHaveBeenCalledWith('all', 'Bank', 2);
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/admin/card-requests?status=all&q=Bank&page=3',
    );
  });
  it('saves incomplete admin drafts and shows resolved requests read-only', async () => {
    const user = userEvent.setup();
    const view = render(
      await ReviewPage({ params: Promise.resolve({ id: '1' }) }),
    );
    await user.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(mocks.review).toHaveBeenCalledWith(
      expect.objectContaining({ requestId: 1, revision: 0, action: 'save' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Review saved.',
    );
    view.unmount();
    mocks.detail.mockResolvedValue({
      request: { ...request, status: 'rejected', decision_note: 'Duplicate' },
    });
    render(await ReviewPage({ params: Promise.resolve({ id: '1' }) }));
    expect(screen.getByText('Duplicate')).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Accept and publish' }),
    ).not.toBeInTheDocument();
  });
});
