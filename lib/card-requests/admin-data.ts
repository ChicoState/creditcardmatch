import { redirect } from 'next/navigation';

import { createAuthServerClient } from '../auth/server';
import { getAuthenticatedUser } from '../account/data';
import type { CardRequest } from './types';

export async function getAdminCardRequests(): Promise<CardRequest[]> {
  await getAuthenticatedUser('/admin/card-requests');
  const auth = await createAuthServerClient();
  const { data: admin, error: adminError } = await auth.rpc('is_admin');
  if (adminError || admin !== true) redirect('/account/current-cards');

  const { data, error } = await auth
    .from('card_requests')
    .select(
      'request_id, user_id, card_name, issuer, reward_types, notification_email, comments, status, reviewed_at, reviewed_by, created_at',
    )
    .order('created_at', { ascending: false });
  if (error) throw new Error('Unable to load card requests.');
  return (data ?? []) as CardRequest[];
}
