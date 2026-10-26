import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

export async function createAuthServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
              });
            });
          } catch {
            // Server Components cannot write cookies; the proxy refreshes them.
          }
        },
      },
    },
  );
}

export function createAuthAdminClient() {
  return createClient(
    requiredEnvironmentVariable('NEXT_PUBLIC_SUPABASE_URL'),
    requiredEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

export async function getCurrentUsername(): Promise<string | undefined> {
  try {
    const { data } = await (await createAuthServerClient()).auth.getUser();
    const username = data.user?.user_metadata?.username;
    return typeof username === 'string' ? username : undefined;
  } catch {
    return undefined;
  }
}
