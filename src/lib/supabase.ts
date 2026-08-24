import { createClient } from '@supabase/supabase-js';

// Central Authoritative Supabase Database Configuration
const CENTRAL_SUPABASE_URL = 'https://ozvqpwsdxkmimzfjmoud.supabase.co';
const CENTRAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96dnFwd3NkeGttaW16Zmptb3VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyNjI3NjMsImV4cCI6MjEwMjgzODc2M30.1IpuMkqP_hOE0cnmuSwT_031zNLXhx2pZA0-IBxbRX4';

const env = (import.meta as any).env || {};
const SUPABASE_URL = 
  env.NEXT_PUBLIC_SUPABASE_URL || 
  (env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') ? env.VITE_SUPABASE_URL : null) || 
  CENTRAL_SUPABASE_URL;

const SUPABASE_ANON_KEY = 
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  (env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_ANON_KEY.includes('idnpfqfxvzskivpdkbdc') ? env.VITE_SUPABASE_ANON_KEY : null) || 
  CENTRAL_SUPABASE_ANON_KEY;

// Resilient fetch wrapper that catches Cloudflare 522/5xx HTML and timeout errors
const safeFetch: typeof fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

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
        JSON.stringify({ error: { message: `Gateway status ${res.status}: Temporary connection timeout` }, data: null }),
        {
          status: res.status >= 500 ? res.status : 503,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    return res;
  } catch (err: any) {
    clearTimeout(timeoutId);
    return new Response(
      JSON.stringify({ error: { message: err?.message || 'Network request failed' }, data: null }),
      {
        status: 503,
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


