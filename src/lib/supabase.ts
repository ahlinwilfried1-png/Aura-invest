import { createClient } from '@supabase/supabase-js';

// Central Authoritative Supabase Database Configuration
const CENTRAL_SUPABASE_URL = 'https://xqwtaosmhearbkravvao.supabase.co';
const CENTRAL_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxd3Rhb3NtaGVhcmJrcmF2dmFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzY5MzMsImV4cCI6MjEwMzE1MjkzM30.BhpXH27y7r8jBJv_zyEOMXT5d--q9ZFQVTlRms0bPpo';

const env = (import.meta as any).env || {};
const SUPABASE_URL = 
  (env.NEXT_PUBLIC_SUPABASE_URL && !env.NEXT_PUBLIC_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') && !env.NEXT_PUBLIC_SUPABASE_URL.includes('ozvqpwsdxkmimzfjmoud') ? env.NEXT_PUBLIC_SUPABASE_URL : null) || 
  (env.VITE_SUPABASE_URL && !env.VITE_SUPABASE_URL.includes('idnpfqfxvzskivpdkbdc') && !env.VITE_SUPABASE_URL.includes('ozvqpwsdxkmimzfjmoud') ? env.VITE_SUPABASE_URL : null) || 
  CENTRAL_SUPABASE_URL;

const SUPABASE_ANON_KEY = 
  (env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('ozvqpwsdxkmimzfjmoud') ? env.NEXT_PUBLIC_SUPABASE_ANON_KEY : null) || 
  (env.VITE_SUPABASE_ANON_KEY && !env.VITE_SUPABASE_ANON_KEY.includes('idnpfqfxvzskivpdkbdc') && !env.VITE_SUPABASE_ANON_KEY.includes('ozvqpwsdxkmimzfjmoud') ? env.VITE_SUPABASE_ANON_KEY : null) || 
  CENTRAL_SUPABASE_ANON_KEY;

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


