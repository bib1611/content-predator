import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Authenticated Supabase Server Client
 * Creates a Supabase client that respects Row-Level Security (RLS) policies
 * Uses the authenticated user's context instead of service role
 */

/**
 * Creates a Supabase client for Server Components and API routes
 * This client respects RLS policies and uses the authenticated user's context
 */
export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Gets the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Requires authentication and returns the user
 * Throws error if not authenticated (to be caught by error handler)
 */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}
