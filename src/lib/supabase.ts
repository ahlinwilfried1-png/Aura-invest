import { createClient } from '@supabase/supabase-js';

// Authoritative Supabase Project URL
const TARGET_PROJECT_REF = 'szekyfonyjycwkpxzmub';
const DEFAULT_SUPABASE_URL = 'https://szekyfonyjycwkpxzmub.supabase.co';

const env = (import.meta as any).env || {};

const rawEnvUrl: string = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_URL: string = rawEnvUrl.includes(TARGET_PROJECT_REF)
  ? rawEnvUrl
  : DEFAULT_SUPABASE_URL;

const rawAnonKey: string = env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const SUPABASE_ANON_KEY: string =
  rawAnonKey && !rawAnonKey.includes('ozvqpwsdxkmimzfjmoud') && !rawAnonKey.includes('ykoqcaggjfhpnysvumuu')
    ? rawAnonKey
    : '';

// Resilient fetch wrapper that catches gateway/timeout errors gracefully
const safeFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok && !contentType.includes('application/json')) {
      return new Response(
        JSON.stringify({ error: { message: `Gateway status ${res.status}: Temporary connection timeout` }, data: [] }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return res;
  } catch {
    clearTimeout(timeoutId);
    return new Response(
      JSON.stringify({ error: null, data: [] }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Public Supabase client (only active when an anon key is provided; server API routes handle PostgreSQL directly)
export const supabase = SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: {
        fetch: safeFetch,
      },
      realtime: {
        timeout: 8000,
      },
    })
  : ({
      from: () => {
        const emptyResult = Promise.resolve({ data: null, error: { message: 'Server API mode active' } });
        const builder: any = {
          select: () => builder,
          insert: () => emptyResult,
          upsert: () => emptyResult,
          update: () => builder,
          delete: () => builder,
          eq: () => builder,
          neq: () => builder,
          in: () => builder,
          limit: () => emptyResult,
          then: (resolve: any, reject: any) => emptyResult.then(resolve, reject),
        };
        return builder;
      },
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} }),
      }),
      removeChannel: () => {},
    } as any);
