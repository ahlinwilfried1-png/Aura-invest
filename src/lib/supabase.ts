import { createClient } from '@supabase/supabase-js';

// Central Authoritative Supabase Database Configuration
const TARGET_PROJECT_REF = 'ykoqcaggjfhpnysvumuu';
const CENTRAL_SUPABASE_URL = 'https://ykoqcaggjfhpnysvumuu.supabase.co';
const CENTRAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb3FjYWdnamZocG55c3Z1bXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjM4OTksImV4cCI6MjEwMzk5OTg5OX0.bw2WBm3lLCE6fbYq5usyqooU5p7Mk-Vfv0iLi-7Jr0U';

const env = (import.meta as any).env || {};

function resolveClientUrl(): string {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL;
  if (url && url.includes(TARGET_PROJECT_REF)) return url;
  return CENTRAL_SUPABASE_URL;
}

function resolveClientAnonKey(): string {
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (key && !key.includes('ozvqpwsdxkmimzfjmoud') && !key.includes('idnpfqfxvzskivpdkbdc')) return key;
  return CENTRAL_SUPABASE_ANON_KEY;
}

const SUPABASE_URL = resolveClientUrl();
const SUPABASE_ANON_KEY = resolveClientAnonKey();

// Resilient fetch wrapper that catches Cloudflare 522/5xx HTML and timeout errors
const safeFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const res = await fetch(input, {
      ...init,
      signal: init?.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    // If response is HTML (e.g. Cloudflare 522 error landing page), return a valid JSON response instead of crashing
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
  } catch (err: any) {
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

// Public Supabase client for client-side user operations with safe fetch and controlled realtime
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: safeFetch,
  },
  realtime: {
    timeout: 8000,
  }
});


