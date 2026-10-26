import { headers } from 'next/headers';

import { createAuthAdminClient } from './server';

export type AuthRateLimitPurpose = 'login' | 'signup';

function getClientIp(headerStore: Headers): string | undefined {
  const forwarded = headerStore.get('x-forwarded-for')?.split(',')[0]?.trim();
  const direct = headerStore.get('x-real-ip')?.trim();
  const ip = forwarded || direct;

  if (ip) return ip;
  return process.env.NODE_ENV === 'production' ? undefined : '127.0.0.1';
}

function getBucketStart(now: Date): string {
  const bucketMilliseconds = 15 * 60 * 1000;
  return new Date(
    Math.floor(now.getTime() / bucketMilliseconds) * bucketMilliseconds,
  ).toISOString();
}

export async function consumeAuthRateLimit(
  purpose: AuthRateLimitPurpose,
): Promise<boolean> {
  const clientIp = getClientIp(await headers());
  if (!clientIp) return false;

  try {
    const { data, error } = await createAuthAdminClient().rpc(
      'consume_auth_rate_limit',
      {
        p_purpose: purpose,
        p_client_ip: clientIp,
        p_bucket_start: getBucketStart(new Date()),
        p_limit: 10,
      },
    );

    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}
