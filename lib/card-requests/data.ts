import { redirect, notFound } from 'next/navigation';
import { createAuthServerClient } from '../auth/server';
import { getAuthenticatedUser } from '../account/data';
import type { RequestSummary } from './types';
import type { CardDetails } from './details';

const columns =
  'request_id,user_id,card_name,issuer,reward_types,comments,status,reviewed_at,reviewed_by,created_at,submission_details,decision_note,catalog_card_id,revision';
export async function requestClient(
  admin = false,
  path = '/account/card-requests',
) {
  await getAuthenticatedUser(path);
  const auth = await createAuthServerClient();
  if (admin) {
    const result = await auth.rpc('is_admin');
    if (result.error || result.data !== true)
      redirect('/account/current-cards');
  }
  return auth;
}
export async function getRequestHistory() {
  const auth = await requestClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  const result = await auth
    .from('card_requests')
    .select(columns)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false });
  if (result.error) throw Error('Unable to load your card requests.');
  return result.data as RequestSummary[];
}
export async function getReviewQueue(
  status: string,
  search: string,
  page: number,
) {
  const auth = await requestClient(true, '/admin/card-requests');
  let query = auth.from('card_requests').select(columns, { count: 'exact' });
  if (['pending', 'approved', 'rejected'].includes(status))
    query = query.eq('status', status);
  // Remove PostgREST grammar and wildcard characters before building the OR filter.
  const term = search.replace(/[^\p{L}\p{N} -]/gu, '').slice(0, 100);
  if (term)
    query = query.or(`card_name.ilike.%${term}%,issuer.ilike.%${term}%`);
  const result = await query
    .order('created_at', { ascending: status === 'pending' })
    .order('request_id')
    .range((page - 1) * 25, page * 25 - 1);
  if (result.error) throw Error('Unable to load card requests.');
  return {
    requests: result.data as RequestSummary[],
    total: result.count ?? 0,
  };
}
export async function getReviewRequest(id: number) {
  const auth = await requestClient(true, `/admin/card-requests/${id}`);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const [request, draft] = await Promise.all([
    auth
      .from('card_requests')
      .select(columns)
      .eq('request_id', id)
      .maybeSingle(),
    auth
      .from('card_request_drafts')
      .select('details')
      .eq('request_id', id)
      .maybeSingle(),
  ]);
  if (request.error || draft.error) throw Error('Unable to load the review.');
  if (!request.data) notFound();
  return {
    request: request.data as RequestSummary,
    draft: draft.data?.details as CardDetails | undefined,
  };
}
